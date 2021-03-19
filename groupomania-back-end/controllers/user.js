const db = require("../models/index.js");
const Users = db.users;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = (req, res, next) => { // Connexion
    if(!req.body.email || !req.body.passwrd)return res.status(400).send({message: "La requête soumise est incomplète."});

    Users.findOne({ where: {email: req.body.email} })
        .then(data => {
            if(!data)return res.status(401).send({error_code: 1, message: 'L\'identifiant saisie ne correspond à aucun compte.' });
            bcrypt.compare(req.body.passwrd, data.password)
            .then(valid => {
                if(!valid)return res.status(401).send({error_code: 2, message: 'Le mot de passe saisi est incorrect.' });
                const newToken = jwt.sign({tokenOwner: data.id }, 'TOK3N_S3CR3T', { expiresIn: '24h' });
                res.setHeader('Authorization', 'Bearer ' + newToken);
                res.status(201).send({error_code: 0, token: newToken, message: 'Connexion établie.'});
            })
            .catch(error => res.status(500).send({error_code: 5, message: 'Une erreur est survenue (' + error + ')'}));
        })
        .catch(error => res.status(500).send({error_code: 3, message: 'Une erreur est survenue (' + error + ')'}));
}

exports.signup = (req, res, next) => { // Inscription
    const user_exist = 1;
    const email_exist = 2;

    if(!req.body.username || !req.body.email || !req.body.passwrd || req.body.passwrd != req.body.passwrdrpt)return res.status(400).send({message: "La requête soumise est incomplète."});
    
    // Check if email/username is already registered in database
    Users.findAll({where: db.sequelize.or({ email: req.body.email }, { username: req.body.username })})
        .then(data => {
            if(data.length == 0) { // Data is empty
                signupExec(0);
            } else { // Another email/user exist
                for(let i = 0; i < data.length; i++) {
                    if(data[i].username == req.body.username)return signupExec(user_exist);
                    if(data[i].email == req.body.email)return signupExec(email_exist);
                }
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
            if(conflict == user_exist) return res.status(400).send({error_code: 1, message: "Ce nom d'utilisateur est déjà utilisé par quelqu'un."});
            // Email already registered
            if(conflict == email_exist) return res.status(400).send({error_code: 2, message: "Cet email est déjà utilisé par quelqu'un."});
        }
    }
}

exports.getUserData = (req, res, next) => { // Get data of user
    Users.findOne({ where: {id: req.body.tokenOwner} })
        .then(data => { 
            if(data) {
                exportUserData(data.dataValues)
            } else {
                throw {};
            }
        })
        .catch(err => { res.status(401).send({message: 'Un problème d\'authentification est survenu.'})});

    function exportUserData(user) {
        delete user.password
        res.status(201).send({data: user, message: 'Authentification vérifiée.'})
    }
}