const getTithesReport = async (req,res) => {
  try {
    
  } catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }  
};

const getExpenseReport = async (req,res) => {
  try {
    
  } catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }  
};

export { getTithesReport, getExpenseReport };