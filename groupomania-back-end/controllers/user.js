const db = require("../models/index.js");
const Users = db.users;

const bcrypt = require('bcrypt');

exports.signup = (req, res, next) => { // Inscription
    if(!req.body.username || !req.body.email || !req.body.passwrd || req.body.passwrd != req.body.passwrdrpt)return res.status(400).send({message: "La requête soumise est incomplète."});
    
    // Check if email/username is already registered in database
    Users.findAll({where: db.sequelize.or({ email: req.body.email }, { username: req.body.username })})
        .then(data => {
            if(data.length == 0) { // Data is empty
                signupExec(0);
            } else { // Another email/user exist
                let username_exist = false; let email_exist = false;
                for(let i = 0; i < data.length; i++) {
                    if(data[i].username == req.body.username) { username_exist = true; }
                    if(data[i].email == req.body.email) { email_exist = true; }
                }
                if(username_exist) return signupExec(1);
                if(email_exist) return signupExec(2);
            }
        });

    // Registration execution
    function signupExec(conflict) {
        if(!conflict) { // Email and Username are available
            const hash = bcrypt.hashSync(req.body.passwrd, bcrypt.genSaltSync(10));
            const users = { email: req.body.email, username: req.body.username, password: hash, isAdmin: 0 };
            Users.create(users)
                .then(data => {
                    res.status(201).send({error_code: 0, message : 'Inscription effectuée.' });
                })
                .catch(err => { res.status(500).send({error_code: 9, message: "Une erreur est survenue (" + err + ")"}) });
        } else {
            // Username already registered
            if(conflict == 1) return res.status(401).send({error_code: 1, message: "Ce nom d'utilisateur est déjà utilisé par quelqu'un."});
            // Email already registered
            if(conflict == 2) return res.status(401).send({error_code: 2, message: "Cet email est déjà utilisé par quelqu'un."});
        }
    }
}

exports.login = (req, res, next) => {
    console.log('Connexion');
}