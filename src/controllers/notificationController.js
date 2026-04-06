const getNotifications = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message})
    }
};

const markAsRead = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message})
    }
};

const markAllAsRead = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message})
    }
};

export { getNotifications, markAsRead, markAllAsRead};