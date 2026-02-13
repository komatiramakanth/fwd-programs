exports.isStudentLoggedIn = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next();
    } else {
        return res.status(401).send('Unauthorized. Please login.');
    }
};

exports.isFacultyLoggedIn = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'faculty') {
        next();
    } else {
        return res.status(401).send('Unauthorized. Faculty login required.');
    }
};
