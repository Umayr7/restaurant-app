var express = require('express')
var htpp = require('http')
var mysql = require('mysql')
var app = express()
var bodyParser = require('body-parser')
var expressValidator = require('express-validator')
const { check, validationResult } = require('express-validator/check');
const {matchedData, sanitizeBody} = require('express-validator/filter')
var flash = require('connect-flash')
var session = require('express-session')
var multer = require('multer')
var fs = require('fs')
var dateFormat = require('dateformat')
var nodemailer = require('nodemailer')
const passport = require('passport')

//global variables...
let user_present = 0 
var name = ""
var time = ""
var regular = ""
var large = ""
var xlarge = ""
var user_obj = {}
var m_id
let o_id
let get_price
var PORT = process.env.PORT || 8000

//for parsing data...
app.use(bodyParser.urlencoded({ extended: true }))

//setting template engine...
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

//for formatting date...
var now = new Date()

//Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }));

app.use(flash())

//Express Message Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//setting all statics for front-end
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'))
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'))
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'))
app.use(express.static(__dirname + '/public'))

const databaseSetup = {
    host: "localhost",
    user: "root",
    password: "",
    database: "restaurant",
    multipleStatements: true,    
}

const db = mysql.createConnection(databaseSetup)
db.connect((err)=>{
    if(err) throw err

    console.log('MySql connected...');
})

if(user_present == 0)
{
    sql = `UPDATE meal SET meal_log = ${0};`
    
        db.query(sql, (err, result)=>{
            if(err) throw err
        })
}

app.get('/', (req, res)=>{
        let sql= "SELECT * FROM menu;"
        
        db.query(sql, (err, result)=>{
    
            res.render('home', {
                user_obj: user_obj,
                items: result,
        })
       
        })
})

app.get('/about', (req, res)=>{
    res.render('about', {
        user_obj: user_obj
    })
})

app.get('/contact', (req, res)=>{
    res.render('contact', {
        user_obj: user_obj
    })
})

app.get('/service', (req, res)=>{
    res.render('service', {
        user_obj: user_obj
    })
})

app.get('/register', (req, res)=>{
    res.render('register', {
        user_obj: user_obj,
        errors: {},
        validatedData: {}
    })
})

app.post('/register', [
    check('user_first_name', 'First Name is required').notEmpty(),
    check('user_last_name', 'Last Name is required').notEmpty(),
    check('user_email', 'Email is required').isEmail(),
    check('user_phone_no', 'Phone Number is required').isInt().isLength({min: 11, max: 11}),
    check('user_address', 'Home Address is required').notEmpty(),
    check('user_password', 'Password is required').isLength({min: 5}),
    check('user_cpassword', 'Please confirm password').custom((value, {req, loc, path}) => {
      if (value !== req.body.user_password) {
        throw new Error("Passwords don't match");
      } else { return value; }
    })
  ], (req, res)=>{
      
    let query = "INSERT INTO `user` (user_first_name, user_last_name, user_email, user_phone_no, user_address, user_password) VALUES ("
    query += " '"+req.body.user_first_name+"',"
    query += " '"+req.body.user_last_name+"',"
    query += " '"+req.body.user_email+"',"
    query += " '"+req.body.user_phone_no+"',"
    query += " '"+req.body.user_address+"',"
    query += " '"+req.body.user_password+"');"
    
    //Get Errors
    const errors = validationResult(req)

    if(!errors.isEmpty())
    {
        const validatedData = matchedData(req)

        res.render('register', {
            user_obj: user_obj,
            errors: errors.mapped(),
            validatedData: validatedData
        })
    }
    else
    {
        db.query(query, (err, result)=>{
            if(err) throw err

            time = req.body.menu_service_time
            name = req.body.menu_name
            req.flash('success', 'You are now registered and can log in!')
            res.redirect('/login')

        })
    }
})

app.get('/login', (req, res)=> {
    user_present=0
    user_obj = {}
    res.render('login', {
        user_obj: user_obj
    })
})

app.post('/login', (req, res)=>{
    let sql= "SELECT * FROM user WHERE user_email ='"+ req.body.user_email +"' "
    sql += "AND user_password ='"+ req.body.user_password +"' ;"
    
    db.query(sql, (err, result)=>{
            if(err)
            {
                throw err;
            }

            if(!isEmpty(result))
            {
                user_obj = {
                    u_id: result[0].user_id,
                    f_name: result[0].user_first_name,
                    l_name: result[0].user_last_name,
                    email: result[0].user_email
                }
                user_present = 1
                res.redirect('/bypass')
            }
            else
            {
                req.flash('danger', 'Invalid email or password')
                res.redirect('/login')
            } 
    })
})

app.get('/bypass', ensureUserAuthenticated, (res, req)=>{
    let now = new Date(new Date().toDateString())
    now = now.toISOString().split('T')[0]

    sql = "INSERT INTO `orders` (user_id, order_date) values ('"+ JSON.stringify(user_obj.u_id) +"'," 
    sql += "'"+  dateFormat(now, "yyyy-mm-dd") +"');"
    sql += "SELECT order_id FROM `orders` WHERE order_id = (SELECT max(order_id) FROM `orders`);"

    db.query(sql, (err, data)=>{
        if(err) throw err

        o_id_json =  JSON.stringify(data[1])
        o_id_json_parsed =  JSON.parse(o_id_json)
        o_id = o_id_json_parsed[0]["order_id"]
        
        req.redirect('/')
    })
})

app.get('/logout', ensureUserAuthenticated, (req, res)=> {
    req.logout()
    req.flash('success', 'you are logged out')
    
    sql = `UPDATE meal SET meal_log = ${0} WHERE user_id = ${JSON.stringify(user_obj.u_id)}`

    db.query(sql, (err, result)=>{
        user_obj = {}
        user_present = 0

        res.render('login', {
            user_obj: user_obj
        })
    })
})

app.get('/menu-detail/:id', (req, res)=>{
    m_id = req.params.id
    
    sql = "SELECT * FROM menu WHERE menu_id = '"+ m_id +"';"

    db.query(sql, (err, result)=>{
        res.render('menu-detail', {
            user_obj: user_obj,
            item: result
        })
    })
})

app.post('/menu-detail/:id', (req, res)=>{
    const errors = validationResult(req)
    
    regular = req.body.menu_price_regular
    large = req.body.menu_price_large
    xl = req.body.menu_price_xlarge

    if(regular != undefined)
    {
        if(large != undefined || xl != undefined)
        {   
            req.flash('danger', 'Please choose one price')
            res.redirect(`/menu-detail/${m_id}`)
        }
        else
        {
            let query = `SELECT menu_price_regular from menu WHERE menu_id = ${m_id};`
            
            db.query(query, (err,result)=>{
                if(err) throw err
                
                get_price_json =  JSON.stringify(result)
                get_price_json_parsed =  JSON.parse(get_price_json)
                get_price = get_price_json_parsed[0]["menu_price_regular"]
                
                if(req.body.Checkout != undefined)
                {
                    res.redirect('/checkout-request/:id')
                }
                else if(req.body.Cart != undefined)
                {
                    res.redirect('/cart/:id')
                }
            })
        }
    }
    else if(large != undefined)
    {
        if(regular != undefined || xl != undefined)
        {   
            req.flash('danger', 'Please choose one price')
            res.redirect(`/menu-detail/${m_id}`)
        }
        else
        {
            let query = `SELECT menu_price_large from menu WHERE menu_id = ${m_id};`
            
            db.query(query, (err,result)=>{
                if(err) throw err
                
                get_price_json =  JSON.stringify(result)
                get_price_json_parsed =  JSON.parse(get_price_json)
                get_price = get_price_json_parsed[0]["menu_price_large"]
    
                if(req.body.Checkout != undefined)
                {
                    res.redirect('/checkout-request/:id')
                }
                else if(req.body.Cart != undefined)
                {
                    res.redirect('/cart/:id')
                }
            })
        }
    }
    else if(xl != undefined)
    {
        if(large != undefined || regular != undefined)
        {
            req.flash('danger', 'Please choose one price')
            res.redirect(`/menu-detail/${m_id}`)
        }
        else
        {
            let query = `SELECT menu_price_xlarge from menu WHERE menu_id = ${m_id};`
    
            db.query(query, (err,result)=>{
                if(err) throw err
                
                get_price_json =  JSON.stringify(result)
                get_price_json_parsed =  JSON.parse(get_price_json)
                get_price = get_price_json_parsed[0]["menu_price_xlarge"]
                
                if(req.body.Checkout != undefined)
                {
                    res.redirect('/checkout-request/:id')
                }
                else if(req.body.Cart != undefined)
                {
                    res.redirect('/cart/:id')
                }
            })
        }
    }
    else
    {
        req.flash('danger', 'Please select price')
        res.redirect(`/menu-detail/${m_id}`)   
    }   
})


app.get('/checkout-request/:id', ensureUserAuthenticated, (req, res)=>{
    if(regular != undefined)
    {
        if(large != undefined || xl != undefined)
        {
            req.flash('danger', 'Please choose one price')
            res.redirect(`/menu-detail/${m_id}`)
        }

        let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
        query += " '"+ m_id +"',"
        query += " '"+JSON.stringify(user_obj.u_id)+"',"
        query += " '"+1+"',"
        query += " '"+ o_id +"',"
        query += " '"+ get_price +"');"
        
        db.query(query, (err,result)=>{
            if(err) throw err
            
            res.redirect('/checkout')
        })
    }
    else if(large != undefined)
    {
        if(regular != undefined || xl != undefined)
        {
            req.flash('danger', 'Please choose one price')
            res.redirect(`/menu-detail/${m_id}`)
        }

        let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
        query += " '"+m_id+"',"
        query += " '"+JSON.stringify(user_obj.u_id)+"',"
        query += " '"+1+"',"
        query += " '"+ o_id +"',"
        query += " '"+ get_price +"');"

        db.query(query, (err,result)=>{
            if(err) throw err
            
            res.redirect('/checkout')
        })
    }
    else if(xl != undefined)
    {
        if(large != undefined || regular != undefined)
        {
            req.flash('danger', 'Please choose one price')
            res.redirect(`/menu-detail/${m_id}`)
        }

        let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
        query += " '"+m_id+"',"
        query += " '"+JSON.stringify(user_obj.u_id)+"',"
        query += " '"+1+"',"
        query += " '"+ o_id +"',"
        query += " '"+ get_price +"');"

        db.query(query, (err,result)=>{
            if(err) throw err
            
            res.redirect('/checkout')
        })
    }
    else
    {
        req.flash('danger', 'Please select price')
        res.redirect(`/menu-detail/${m_id}`)
    }    
    
})

app.get('/checkout', ensureUserAuthenticated, (res, req)=>{
    let sql = `SELECT menu.menu_name, meal.meal_price AS price FROM menu JOIN meal ON menu.menu_id=meal.menu_id `
    sql += `WHERE meal.user_id=${JSON.stringify(user_obj.u_id)} AND meal_log=${1};`
    
    db.query(sql, (err,ans)=>{
        if(err) throw err
       
        req.render('checkout', {
            items: ans,
            user_obj: user_obj,
        })
    })
})

app.get('/cart/:id', (req, res)=>{

    let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
    query += " '"+m_id+"',"
    query += " '"+JSON.stringify(user_obj.u_id)+"',"
    query += " '"+1+"',"
    query += " '"+ o_id +"',"
    query += " '"+ get_price +"');"

    db.query(query, (err,result)=>{
        if(err) throw err

        req.flash('success', 'Meal added to your cart')
        res.redirect('/')
    })      
})

app.get('/order-done', ensureUserAuthenticated, (req, res)=>{
    u_email = JSON.stringify(user_obj.email)

    let sql = `SELECT menu.menu_name, menu.menu_service_time as time, meal.meal_price AS price, `
    sql += `concat(user.user_first_name," ", user.user_last_name) AS name FROM meal JOIN menu `
    sql += `ON menu.menu_id=meal.menu_id JOIN user ON user.user_id = meal.user_id `
    sql += `WHERE meal.user_id=${JSON.stringify(user_obj.u_id)} AND meal_log=${1};`
    
    db.query(sql, (err, result)=>{
        if(err) throw err

        amount = []
        m_name = []
        total=0
        expected=0
        result.forEach((item, index)=>{
            if(index == 0)
            {
                u_name = item.name
                expected = item.time
            }
            amount.push(item.price)
            m_name.push(item.menu_name)
            total += amount[index]
        });
        
        mail = `Dear customer ${u_name}, your order has been placed ...\n`
        mail += `ORDER DETAIL:\n`
        result.forEach((item, index)=>{
            mail += `${m_name[index]}\t\t${amount[index]}\n`
        })
        mail += `Total Amount: Rs. ${total}/-\n`
        mail += `Expected Time: ${expected} minutes\n\n\n`
        mail += `Thankyou for Ordering from Luigi's Family Pizzeria. We hope you like your order and visit again for more!`
        
        //Setting up nodemailer to send mail...

        var transporter = nodemailer.createTransport({
            host: "smtp.mailgun.org",
            port: 587,
            secure: false,
            auth: {
                user: 'postmaster@sandbox0bf740726fbb47fabfc15889b69722ed.mailgun.org',
                pass: '92161a8cfddc933560eda8c6ba75d5ff-1b6eb03d-ba823506'
            }
        })
        var mailOptions = {
            from: 'postmaster@sandbox0bf740726fbb47fabfc15889b69722ed.mailgun.org',
            to: u_email,
            subject: `Luigi's Pizzeria Order receipt!`,
            text: mail
        }
    
        transporter.sendMail(mailOptions, (err, info)=>{
            if(err) throw err

            req.flash('success', 'Order Confirmed! Check email for details.')
            res.redirect('/')
        })
    })

})

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function ensureUserAuthenticated(req, res, next)
{
    if(user_present==1)
    {
        return next()
    }
    else
    {
        req.flash('danger', 'Please Login')
        res.redirect('/login')
    }
}

//Exporting database to admin route
module.exports = {
    db: mysql.createConnection(databaseSetup),
}

//setting route for admin
let admin = require('./routes/admin')
app.use('/admin', admin)

//Setting server
var server = app.listen(PORT, ()=>{
    console.log('Server started on port 8000...');
})