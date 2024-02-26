const db = require('../services/db');

class Payroll {

    workdayId;
    userId;
    selecteddate;
    jobtype;
    description;
    category;
    amount;
    payrollstatus;

    constructor(userId, selecteddate, jobtype, description, category, amount, payrollstatus) {
        this.userId = userId;
        this.selecteddate = selecteddate;
        this.jobtype = jobtype;
        this.description = description;
        this.category = category;
        this.amount = amount;
        this.payrollstatus = payrollstatus;
    }

    async createPayroll() {
        let sql = "INSERT INTO payroll (UserId, selecteddate, jobtype, description, category, Amount, payrollstatus) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const result = await db.query(sql, [this.userId, this.selecteddate, this.jobtype, this.description, this.category, this.amount, this.payrollstatus]);
        this.workdayId = result.insertId;
        return true;
    }

    static async getPayrollByUser(userId) {
        let sql = "SELECT * FROM payroll WHERE UserId = ?";
        const results = await db.query(sql, [userId]);
        return results;
    }

    static async getPayrollById(workdayId) {
        let sql = "SELECT * FROM payroll WHERE WorkdayId = ?";
        const results = await db.query(sql, [workdayId]);
        return results;
    }

    async updatePayroll() {
        let sql = "UPDATE payroll SET UserId = ?, selecteddate = ?, jobtype = ?, description = ?, category = ?, Amount = ?, status = ? WHERE WorkdayId = ?";
        await db.query(sql, [this.userId, this.selecteddate, this.jobtype, this.description, this.category, this.amount, this.payrollstatus, this.workdayId]);
        return true;
    }

    static async deletePayroll(workdayId) {
        let sql = "DELETE FROM payroll WHERE WorkdayId = ?";
        await db.query(sql, [workdayId]);
        return true;
    }
}

module.exports = {
    Payroll
};
