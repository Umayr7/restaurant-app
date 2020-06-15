var express = require('express')
var htpp = require('http')
var mysql = require('mysql')
var app = express()
var bodyParser = require('body-parser')
var passport = require('passport')
var expressValidator = require('express-validator')
const { check, validationResult } = require('express-validator/check');
const {matchedData, sanitizeBody} = require('express-validator/filter')
var flash = require('connect-flash')
var session = require('express-session')
var multer = require('multer')
var fs = require('fs')
var path = require('path')
var dateFormat = require('dateformat')
var nodemailer = require('nodemailer')

//global variables...
let user_present = 0 
var name = ""
var time = ""
var regular = ""
var large = ""
var xlarge = ""
var user_obj = {}
var val = 0
var m_id
var check_price = 0
var checkout_detail = {}

//for parsing data...
app.use(bodyParser.urlencoded({ extended: true }))

//setting template engine...
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
// app.set('views', __dirname + '/views/cart')


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

// Express Validator Middleware

//Passport Config
// require('./config/passport')(passport)

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Multer Config
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

//Init upload
const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function (req,file, cb) {
        checkFileType(file, cb)
    }
}).single('menu_image')

function checkFileType(file, cb) {
    //Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    //Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    //Check mime
    const mimetype = filetypes.test(file.mimetype)

    if(mimetype && extname)
    {
        return cb(null, true)
    }
    else
    {
        cb('Error: Images Only!')
    }
}

//setting all statics for front-end
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'))
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'))
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'))
app.use(express.static(__dirname + '/public'))

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "restaurant",
    multipleStatements: true,
})

db.connect((err)=>{
    if(err) throw err

    console.log('MySql connected...');
    
})


app.get('/', (req, res)=>{
   
    // if(user_obj > 0)
    // {
        let sql= "SELECT * FROM menu;"
        db.query(sql, (err, result)=>{
            console.log(result);
            
    
            res.render('home', {
                user_obj: user_obj,
                items: result,
                val: val
        })
       
        })
    // }
    // console.log("ELSEEEEEEEEEEEEEEEEEEEEEE");
    
    // let sql= "SELECT * FROM menu;"
    // db.query(sql, (err, result)=>{
    //     console.log(result);
        

    //     res.render('home', {
    //         user_obj: user_obj,
    //         items: result,
    //         val: val
    // })
   
    // })
})

app.get('/test', (req, res)=>{
    
    sql = `SELECT user.user_first_name, menu.menu_name FROM user JOIN meal ON user.user_id=meal.user_id JOIN 
    menu ON menu.menu_id=meal.menu_id`

    db.query(sql, (err, result)=>{
        res.send(result)
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

app.get('/admin', (req, res)=>{
    user_present = 0
    res.render('admin-login')
})

//Login POST
app.post('/admin', (req,res, next)=>{
    console.log('post method triggered');

    let sql= "SELECT * FROM user WHERE user_is_admin = '"+ 1 +"' AND user_email ='"+ req.body.user_email +"' ; SELECT * FROM user WHERE user_password ='"+ req.body.user_password +"' "
    
    db.query(sql, (err, result)=>{
            if(err)
            {
                console.log("[mysql error]",err);
            }

            if(result[0].length > 0)
            {
                if(result[1].length > 0)
                {
                    console.log('passed')
                    console.log(result[0]);
                    user_present = 1
                    res.redirect('/admin/panel')
                }
                else
                {
                    console.log('failed');
                    req.flash('danger', 'Invalid email or password')
                    res.redirect('/admin')
                }
            }
            else
            {
                req.flash('danger', 'Invalid email or password')
                res.redirect('/admin')
            } 
    })
})

app.get('/admin/logout', (req, res)=>{
    user_present=0
    req.flash('success', 'you are logged out')
    res.redirect('/admin')
})

app.get('/admin/panel', ensureAuthenticated, (req, res)=>{
    res.render('admin-panel')
})

app.get('/admin/panel/customers', ensureAuthenticated, (req, res)=>{
    sql = "SELECT * FROM user ORDER BY user_id"
    db.query(sql, (err, result)=>{
        if(err) throw err
        res.render('admin-panel-customer', {
            items: result
        })
    })
})
app.get('/admin/panel/customers/edit/:id', ensureAuthenticated, (req, res)=>{
    db.query("SELECT * FROM user WHERE user_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        //formatting date
        // result[0].e_start_date = dateFormat(result[0].e_start_date, "yyyy-mm-dd")
        // result[0].e_end_date = dateFormat(result[0].e_end_date, "yyyy-mm-dd")

        res.render('customers-edit', {
            item: result
        })
    })
})

//submit edit form
app.post('/admin/panel/customers/edit/:id', (req, res)=>{
    var query = "UPDATE `user` SET " 
    query += "`user_first_name` = '"+req.body.user_first_name+"',"
    query += "`user_last_name` = '"+req.body.user_last_name+"',"
    query += "`user_address` = '"+req.body.address+"',"
    query += "`user_phone_no` = '"+req.body.user_phone_no+"',"
    query += "`user_password` = '"+req.body.user_password+"'"
    query += " WHERE `user`.`user_id` = "+req.body.user_id+" "

    db.query(query, (err, result)=>{
        if(err) throw err

        if(result.affectedRows)
        {
            res.redirect('/admin/panel/customers')
        }
    })
})

//delete event
app.get('/admin/panel/customers/delete/:id', (req, res)=>{
    db.query("DELETE FROM user WHERE user_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        if(result.affectedRows)
        {
            res.redirect('/admin/panel/customers')
        }
    })
})

app.get('/admin/panel/menu', ensureAuthenticated, (req, res)=>{
    sql = "SELECT * FROM menu ORDER BY menu_id"
    db.query(sql, (err, result)=>{
        if(err) throw err
        res.render('admin-panel-menu', {
            items: result
        })
    })
})

app.get('/admin/panel/menu/add', ensureAuthenticated, (req,res)=>{
    res.render('menu-add', {
        items: '',
        errors: {},
        validatedData: {}
    })
})

app.post('/admin/panel/menu/add', [
    check('menu_name', 'Please enter Menu name').notEmpty(),
    check('menu_service_time', 'Please enter Service Time').notEmpty(),
    check('menu_price_regular', 'Please enter Price for Regular').notEmpty(),
    check('menu_price_large', 'Please enter Price for Regular').notEmpty(),
    check('menu_price_xlarge', 'Please enter Price for Regular').notEmpty(),
], (req, res)=>{
    let query = "INSERT INTO `menu` (menu_name, menu_service_time, menu_price_regular, menu_price_large, menu_price_xlarge) VALUES ("
    query += " '"+req.body.menu_name+"',"
    query += " '"+req.body.menu_service_time+"',"
    query += " '"+req.body.menu_price_regular+"',"
    query += " '"+req.body.menu_price_large+"',"
    query += " '"+req.body.menu_price_xlarge+"');"
    
    console.log(req.body.menu_name);

    console.log('start');
    console.log(validationResult(req));
    console.log('end');
    
    const errors = validationResult(req)
    console.log(errors.mapped());

    if(!errors.isEmpty())
    {
        const validatedData = matchedData(req)

        res.render('menu-add', {
            items: '',
            errors:errors.mapped(),
            validatedData: validatedData,
        })
    }
    else
    {
        db.query(query, (err, result)=>{
            if(err) throw err

            req.flash('success','Event Added successfully!')
            user_present=1
            name = req.body.menu_name
            time = req.body.menu_service_time
            regular = req.body.menu_price_regular
            large = req.body.menu_price_large
            xlarge = req.body.menu_price_xlarge

            res.redirect('/admin/panel/menu/add-image')

        })
    }

})


app.get('/admin/panel/menu/add-image', ensureAuthenticated, (req, res)=>{
    res.render('menu-image', {
        detail: {
            name: name,
            time: time,
            regular: regular,
            large: large,
            xlarge: xlarge
        },
    })
})

app.post('/admin/panel/menu/add-image', (req, res)=>{
    upload(req, res, (err)=>{
                if(err) 
                {
                    console.log('Error!');
                    res.render('menu-image', {
                        detail: {
                            name: name,
                            time: time,
                            regular: regular,
                            large: large,
                            xlarge: xlarge
                        },
                        msg: err
                    })
                }
                else
                {
                    if(req.file == undefined)
                    {
                        console.log('Error: No image Selected!');
                        
                        res.render('menu-image', {
                            detail: {
                                name: name,
                                time: time,
                                regular: regular,
                                large: large,
                                xlarge: xlarge
                            },
                            msg: 'Error: No image Selected!'
                        })
                    }
                    else
                    {
                        path = `uploads/${req.file.filename}`
                        sql = "UPDATE `menu` SET `menu_image` = '"+path+"' WHERE `menu_name` = '"+ name +"' ; SELECT * FROM menu ORDER BY menu_id ; "
                        db.query(sql, (err, result)=>{
                            if(err) throw err
                            console.log(`filename : ${path}`);
                            

                            // query = "UPDATE `menu` SET `menu_image` = '"+req.file.filename+"' WHERE `menu_name` = '"+ name +"' ;"

                                res.render('admin-panel-menu', {
                                    items: result[1],
                                    msg: 'image Uploaded',
                                    file: `uploads/${req.file.filename}`,
                                })
                        })                      
                    }
                }
            })
})

app.get('/admin/panel/menu/delete/:id', ensureAuthenticated, (req, res)=>{
    db.query("DELETE FROM menu WHERE menu_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        if(result.affectedRows)
        {
            res.redirect('/admin/panel/menu')
        }
    })
})

app.get('/register', (req, res)=>{
    res.render('register', {
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

        console.log('val data');
        console.log(validatedData);
        

        res.render('register', {
            errors: errors.mapped(),
            validatedData: validatedData
        })
        console.log(errors);
        
    }
    else
    {
        db.query(query, (err, result)=>{
            if(err) throw err

            req.flash('success', 'You are now registered and can log in!')
            name = req.body.menu_name
            time = req.body.menu_service_time
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
    console.log('post method triggered');

    let sql= "SELECT * FROM user WHERE user_email ='"+ req.body.user_email +"' AND user_password ='"+ req.body.user_password +"' ;"
    
    db.query(sql, (err, result)=>{
            if(err)
            {
                console.log("[mysql error]",err);
            }

            if(!isEmpty(result))
            {
                user_obj = {
                    u_id: result[0].user_id,
                    f_name: result[0].user_first_name,
                    l_name: result[0].user_last_name,
                    email: result[0].user_email
                }
                
                console.log('passed')
                console.log(result);
                console.log(user_obj);
                
                user_present = 1
                res.redirect('/bypass')
            }
            else
            {
                console.log(result);
                req.flash('danger', 'Invalid email or password')
                res.redirect('/login')
            } 
    })
})

let o_id

app.get('/bypass', (res, req)=>{
    let now = new Date(new Date().toDateString())
    now = now.toISOString().split('T')[0]

    sql = "INSERT INTO `orders` (user_id, order_date) values ('"+ JSON.stringify(user_obj.u_id) +"', '"+  dateFormat(now, "yyyy-mm-dd") +"'); SELECT order_id FROM `orders` WHERE order_id = (SELECT max(order_id) FROM `orders`);"

    db.query(sql, (err, data)=>{
        if(err) throw err

        o_id_json =  JSON.stringify(data[1])
        o_id_json_parsed =  JSON.parse(o_id_json)
        o_id = o_id_json_parsed[0]["order_id"]
        console.log(o_id);
        
        req.redirect('/')
    })
})

app.get('/logout', ensureUserAuthenticated, (req, res)=> {
    req.logout()
    req.flash('success', 'you are logged out')
    console.log(`LOGGED OUT : ${JSON.stringify(user_obj)}`);
    
    sql = `UPDATE meal SET meal_log = ${0} WHERE user_id = ${JSON.stringify(user_obj.u_id)}`

    db.query(sql, (err, result)=>{
        user_obj = {}
        checkout_detail = {}
        user_present = 0
        val = 0

        res.render('login', {
            user_obj: user_obj
        })
    })
})

app.get('/menu-detail/:id', (req, res)=>{

    if(m_id == undefined)
    {
        m_id = req.params.id
    }
    console.log(`M_ID : ${m_id}`);
    
    sql = "SELECT * FROM menu WHERE menu_id = '"+ m_id +"';"

    db.query(sql, (err, result)=>{
        res.render('menu-detail', {
            user_obj: user_obj,
            item: result
        })
    })
})

let get_price

app.post('/menu-detail/:id', (req, res)=>{
    const errors = validationResult(req)

    console.log(`CHECKOUT INPUT NAME : ${req.body.Checkout}`);
    console.log(`CHECKOUT INPUT NAME : ${req.body.Cart}`);
    
    console.log(`IDDDD 11111 :: ${req.params.id}`);

    m_id = req.params.id
    
  
    regular = req.body.menu_price_regular
    large = req.body.menu_price_large
    xl = req.body.menu_price_xlarge
    console.log(`regular : ${regular}`);
    console.log(`large : ${large}`);
    console.log(`xlarge : ${xlarge}`);

    console.log(`BYPAAAAAAAAAAAAAAAAAAAAAAAS`);
    
    if(regular != undefined)
    {
        if(large != undefined || xl != undefined)
        {
            console.log('checkkkkkkkkk');
            console.log("READING");
            
            req.flash('danger', 'Please choose one price')
            res.redirect('/menu-detail/:id')
        }
        else
        {
            let query = `SELECT menu_price_regular from menu WHERE menu_id = ${m_id};`
            
            check_price = 1
            
            db.query(query, (err,result)=>{
                if(err) throw err
                
                get_price_json =  JSON.stringify(result)
                get_price_json_parsed =  JSON.parse(get_price_json)
                get_price = get_price_json_parsed[0]["menu_price_regular"]
    
                console.log(`RESULT PRICEEEEEEE : ${result}`);
                
                console.log(`PRICE REGULARRRRRRR : ${get_price}`);
                
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
            console.log('checkkkkkkkkk');
            
            console.log("READING2");
            
            req.flash('danger', 'Please choose one price')
            res.redirect('/menu-detail/:id')
        }
        else
        {
            let query = `SELECT menu_price_large from menu WHERE menu_id = ${m_id};`
            
            check_price = 2
            db.query(query, (err,result)=>{
                if(err) throw err
                
                get_price_json =  JSON.stringify(result)
                get_price_json_parsed =  JSON.parse(get_price_json)
                get_price = get_price_json_parsed[0]["menu_price_large"]
    
                console.log(`PRICE LARGEEEEEEEE : ${get_price}`);
    
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
            console.log('checkkkkkkkkk');
            
            console.log("READING3");
            
            req.flash('danger', 'Please choose one price')
            res.redirect('/menu-detail/:id')
        }
        else
        {
            let query = `SELECT menu_price_xlarge from menu WHERE menu_id = ${m_id};`
    
            check_price = 3
            db.query(query, (err,result)=>{
                if(err) throw err
                
                get_price_json =  JSON.stringify(result)
                get_price_json_parsed =  JSON.parse(get_price_json)
                get_price = get_price_json_parsed[0]["menu_price_xlarge"]
    
                console.log(`PRICE XLLLLLLLLLLL : ${get_price}`);
                
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
        res.redirect('/menu-detail/:id')   
    }   
})


app.get('/checkout-request/:id', ensureUserAuthenticated, (req, res)=>{
    console.log(`IDDDDDDDDDDD :: ${req.params.id}`);
    

    console.log(`COUTTTTTTTTTTTTT`);
    
    if(regular != undefined)
    {
        if(large != undefined || xl != undefined)
        {
            console.log('checkkkkkkkkk');
            
            req.flash('danger', 'Please choose one price')
            res.redirect('/menu-detail/:id')
        }

        let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
        query += " '"+ m_id +"',"
        query += " '"+JSON.stringify(user_obj.u_id)+"',"
        query += " '"+1+"',"
        query += " '"+ o_id +"',"
        query += " '"+ get_price +"');"
        check_price = 1
        db.query(query, (err,result)=>{
            if(err) throw err
            
            res.redirect('/checkout')
        })
    }
    else if(large != undefined)
    {
        if(regular != undefined || xl != undefined)
        {
            console.log('checkkkkkkkkk');
            
            req.flash('danger', 'Please choose one price')
            res.redirect('/menu-detail/:id')
        }

        let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
        query += " '"+m_id+"',"
        query += " '"+JSON.stringify(user_obj.u_id)+"',"
        query += " '"+1+"',"
        query += " '"+ o_id +"',"
        query += " '"+ get_price +"');"

        check_price = 2
        db.query(query, (err,result)=>{
            if(err) throw err
            
            res.redirect('/checkout')
        })
    }
    else if(xl != undefined)
    {
        if(large != undefined || regular != undefined)
        {
            console.log('checkkkkkkkkk');
            
            req.flash('danger', 'Please choose one price')
            res.redirect('/menu-detail/:id')
        }

        let query = "INSERT INTO `meal` (menu_id, user_id, meal_log, order_id, meal_price) VALUES ("
        query += " '"+m_id+"',"
        query += " '"+JSON.stringify(user_obj.u_id)+"',"
        query += " '"+1+"',"
        query += " '"+ o_id +"',"
        query += " '"+ get_price +"');"

        check_price = 3
        db.query(query, (err,result)=>{
            if(err) throw err
            
            res.redirect('/checkout')
        })
    }
    else
    {
        req.flash('danger', 'Please select price')
        res.redirect('/menu-detail/:id')  
    }    
    
})

app.get('/checkout', ensureUserAuthenticated, checkoutController)
// app.get('/checkout/:id', ensureUserAuthenticated, checkoutController)

function checkoutController (req, res) {
    
    let sql = `SELECT menu.menu_name, meal.meal_price AS price FROM menu JOIN meal ON menu.menu_id=meal.menu_id WHERE meal.user_id=${JSON.stringify(user_obj.u_id)} AND meal_log=${1};`
    
    db.query(sql, (err,ans)=>{
        if(err) throw err

        console.log(`Obj x : ${JSON.stringify(ans)}`);
       
        res.render('checkout', {
            items: ans,
            user_obj: user_obj,
            check_price: check_price
            // val: val
        })
    })    
}

app.get('/order-done', ensureUserAuthenticated, (req, res)=>{

    
    u_email = JSON.stringify(user_obj.email)
    console.log(`EMAIL : ${u_email}`);

    let sql = `SELECT menu.menu_name, menu.menu_service_time as time, meal.meal_price AS price, concat(user.user_first_name," ", user.user_last_name) AS name FROM meal JOIN menu ON menu.menu_id=meal.menu_id JOIN user ON user.user_id = meal.user_id WHERE meal.user_id=${JSON.stringify(user_obj.u_id)} AND meal_log=${1};`
    
    db.query(sql, (err, result)=>{
        if(err) throw err

        console.log(result);
        console.log(result.length);
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

        console.log(amount);
        console.log(m_name);
        console.log(u_name);
        
        mail = `Dear customer ${u_name}, your order has been placed ...\n`
        mail += `ORDER DETAIL:\n`
        result.forEach((item, index)=>{
            mail += `${m_name[index]}\t\t${amount[index]}\n`
        })
        mail += `Total Amount: Rs. ${total}/-\n`
        mail += `Expected Time: ${expected} minutes\n\n\n`
        mail += `Thankyou for Ordering from Luigi's Family Pizzeria. We hope you like your order and visit again for more!`
        

        console.log(mail);
        
        
        var transporter = nodemailer.createTransport({
            host: "smtp.mailgun.org",
            port: 587,
            secure: false,
            auth: {
                user: , //set email
                pass: //set pass
            }
        })
        var mailOptions = {
            from: , // set email
            to: u_email,
            subject: 'Sending email using nodemailer!',
            text: mail
        }
    
        transporter.sendMail(mailOptions, (err, info)=>{
            if(err) throw err
    
            console.log('Email sent' + info.response)
            req.flash('success', 'Order Confirmed! Check email for details.')
            res.redirect('/')
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
        val = val + 1;
        res.redirect('/')
    })      
})

app.get('/admin/panel/orders', ensureAuthenticated, (res, req)=>{
    // sql = "SELECT * FROM menu ORDER BY menu_id"
    
    query = `SELECT concat(user.user_first_name, " ",user.user_last_name) AS name, menu.menu_name, meal.meal_id, meal.order_id, meal.user_id, meal.meal_price AS price FROM menu JOIN meal ON menu.menu_id=meal.menu_id JOIN user ON user.user_id=meal.user_id JOIN orders ON orders.order_id=meal.order_id ORDER BY meal.order_id DESC;`
    // sql = "SELECT * FROM MEAL ORDER BY order_id"
    db.query(query, (err, result)=>{
        if(err) throw err
        
        console.log(result);

        req.render('admin-panel-orders', {
            items: result
        })
    })
})

app.get('/admin/panel/orders/delete/:id', ensureAuthenticated, (req, res)=>{
    db.query("DELETE FROM meal WHERE meal_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        if(result.affectedRows)
        {
            res.redirect('/admin/panel/orders')
        }
    })
})

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


function ensureAuthenticated(req, res, next)
{
    console.log(res.locals.user);
    
    if(user_present==1)
    {
        return next()
    }
    else
    {
        req.flash('danger', 'Please Login')
        res.redirect('/admin')
    }
}

function ensureUserAuthenticated(req, res, next)
{
    console.log(res.locals.user);
    
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

var server = app.listen(8000, ()=>{
    console.log('Server started on port 8000...');
})
