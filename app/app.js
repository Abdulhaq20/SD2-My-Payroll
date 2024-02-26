// Import express.js
const express = require("express");
const { User } = require("./models/user");
const { Payroll } = require("./models/payroll");
const moment = require('moment');

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
// Get the functions in the db.js file to use
const db = require('./services/db');

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Create a route for root - /
/*app.get("/", function(req, res) {
    res.send("Hello world!");
});*/

// Create a route for testing the db
app.get("/db_test", function (req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Create a route for root - /
app.get("/", function (req, res) {
    // Set up an array of data
    var test_data = ['one', 'two', 'three', 'four'];
    // Send the array through to the template as a variable called data
    res.render("index", { 'title': 'My index page', 'heading': 'My heading', 'data': test_data });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function (req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function (req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Register
app.get('/register', function (req, res) {
    res.render('register');
});

// Login route
app.get('/login', function (req, res) {
    res.render('login');
});


// login api
// Check submitted email and password pair
app.post('/authenticate', async function (req, res) {
    const params = req.body; // Declare as const
    const user = new User(params.email);
    

    try {
        const uId = await user.getIdFromEmail();
        if (uId) {
            const match = await user.authenticate(params.password);
            if (match) {
                res.redirect('/dashboard');
            } else {
                res.render('login', { errorMessage: 'Invalid password' });
            }
        } else {
            res.render('login', { errorMessage: 'Email or Password is incorrect' });
        }
    } catch (err) {
        console.error(`Error while comparing `, err.message);
    }
});


//registration api
app.post('/set-password', async function (req, res) {
    const params = req.body; // Declare as const
    const user = new User(params.email);

    try {
        const uId = await user.getIdFromEmail();
        if (uId) {
            await user.setUserPassword(params.password);
            res.render('register', { successMessage: 'Password set successfully' });
        } else {
            const newId = await user.addUser(params.email);
            res.render('register', { successMessage: 'Account created successfully' });
        }
    } catch (err) {
        console.error(`Error while setting password `, err.message);
        res.render('register', { errorMessage: 'An error occurred while setting the password' });
    }
});

// // dashboard route
// app.get('/dashboard', function (req, res) {
//     res.render('dashboard');
// });
// profile route
app.get('/profile', function (req, res) {
    res.render('profile');
});


// faq route
app.get('/faq', function (req, res) {
    res.render('faq');
});

// faq api
app.post('/submit_question', async (req, res) => {
    const { fullName, firstName, lastName, email, severity, question } = req.body;

    const sql = 'INSERT INTO faq (fullName, firstName, lastName, email, severity, question) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [fullName, firstName, lastName, email, severity, question];

    try {
        await db.query(sql, values);
        res.render('faq', { successMessage: 'Question submitted successfully' });
    } catch (error) {
        res.render('faq', { errorMessage: 'Error inserting data into the database' });
    }
});



app.get("/dashboard", async function (req, res) {
    try {
        const userId = 1;
        const payrollRecords = await Payroll.getPayrollByUser(userId);

        const sql1 = 'SELECT SUM(Amount) AS TotalAmountToday FROM payroll WHERE selecteddate = CURDATE()';
        const sql2 = 'SELECT SUM(Amount) AS TotalAmountThisMonth FROM payroll WHERE YEAR(selecteddate) = YEAR(CURDATE()) AND MONTH(selecteddate) = MONTH(CURDATE())';
        const sql3 = 'SELECT SUM(Amount) AS TotalAmountThisYear FROM payroll WHERE YEAR(selecteddate) = YEAR(CURDATE())';
        const sql4 = 'SELECT SUM(Amount) AS TotalAmount FROM payroll';

        const [results1, results2, results3, results4] = await Promise.all([
            db.query(sql1),
            db.query(sql2),
            db.query(sql3),
            db.query(sql4)
        ]);

        res.render("dashboard", {
            'payrollRecords': payrollRecords,
            'today': results1[0].TotalAmountToday || 0,
            'monthly': results2[0].TotalAmountThisMonth || 0,
            'yearly' : results3[0].TotalAmountThisYear || 0,
            'total': results4[0].TotalAmount || 0
        });
    } catch (error) {
        console.error(`Error while fetching payroll records:`, error.message);
        res.render("dashboard", { 'errorMessage': 'Error fetching payroll records' });
    }
});


app.post("/create-payroll", async function (req, res) {
    const params = req.body;

    // Validate the selecteddate format
    const isValidDate = isValidDateFormat(params.selecteddate);

    // Create a new Payroll instance with a valid date or null
    const payroll = new Payroll(
        1,
        isValidDate ? params.selecteddate : null,
        params.jobtype || null,
        params.description || null,
        params.category || null,
        params.Amount || null,
        params.payrollstatus || null
    );

    try {
        await payroll.createPayroll();
        res.render('create_payroll', { successMessage: 'Payroll created successfully' });
    } catch (error) {
        console.log('Error while adding payroll record', error);
        res.render('create_payroll', { errorMessage: 'Error while adding payroll record' });
    }
});

// Function to check if the date is in a valid format
function isValidDateFormat(dateString) {
    return moment(dateString, 'YYYY-MM-DD', true).isValid();
}




// Create a route for deleting a payroll record
app.post("/delete_payroll/:workdayId", async function (req, res) {
    const workdayId = req.params.workdayId;

    try {
        await Payroll.deletePayroll(workdayId);
        res.send({ successMessage: 'Payroll Delete successfully' });
    } catch (error) {
        res.send({ errorMessage: 'Error while deleting payroll record' });
    }
});


// Login route
app.get('/create_payroll', function (req, res) {
    res.render('create_payroll');
});

// Create a route for testing the db
app.get("/all_faq", function (req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from faq';
    db.query(sql).then(results => {
        console.log(results);
        res.render('all_faq', { 'faqRecords': results })
    });
});

// Start server on port 3000
app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});