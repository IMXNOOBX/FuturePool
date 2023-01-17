exports.handle = function(req, res) {
    let db = req.app.get('db');
    let type = req.params.handle

    return { 
        success: true
    }
};