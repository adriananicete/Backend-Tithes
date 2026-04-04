const getAllExpenses = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error)
        res.status(500).json({error: error.message});
    }
};

const createManualExpense = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error)
        res.status(500).json({error: error.message});
    }
};


const autoRecordExpense = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error)
        res.status(500).json({error: error.message});
    }
};


export { getAllExpenses, createManualExpense, autoRecordExpense, createVoucher};