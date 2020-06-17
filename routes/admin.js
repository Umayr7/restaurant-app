const express = require('express')
var mysql = require('mysql')
var multer = require('multer')
var path = require('path')
const router =  express.Router()
const connect = require('../app')

const db = connect.db


const { check, validationResult } = require('express-validator/check');
const {matchedData, sanitizeBody} = require('express-validator/filter')

//global variables
let user_present = 0


//Multer configs for Upload Image
const storage = multer.diskStorage({
    destination: '../public/uploads/',
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


router.get('/', (req, res)=>{
    user_present = 0
    res.render('admin-login')
})

//Login POST
router.post('/', (req,res, next)=>{
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
                    user_present = 1
                    res.redirect('/admin/panel')
                }
                else
                {
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

router.get('/panel', ensureAuthenticated, (req, res)=>{
    res.render('admin-panel')
})

router.get('/panel/customers', ensureAuthenticated, (req, res)=>{
    sql = "SELECT * FROM user ORDER BY user_id"

    db.query(sql, (err, result)=>{
        if(err) throw err

        res.render('admin-panel-customer', {
            items: result
        })
    })
})

router.get('/panel/customers/edit/:id', ensureAuthenticated, (req, res)=>{
    db.query("SELECT * FROM user WHERE user_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        res.render('customers-edit', {
            item: result
        })
    })
})

//submit edit form
router.post('/panel/customers/edit/:id', (req, res)=>{
    var query = "UPDATE `user` SET " 
    query += "`user_first_name` = '"+req.body.user_first_name+"',"
    query += "`user_last_name` = '"+req.body.user_last_name+"',"
    query += "`user_address` = '"+req.body.user_address+"',"
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
router.get('/panel/customers/delete/:id', (req, res)=>{
    db.query("DELETE FROM user WHERE user_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        if(result.affectedRows)
        {
            res.redirect('/admin/panel/customers')
        }
    })
})

router.get('/panel/menu', ensureAuthenticated, (req, res)=>{
    sql = "SELECT * FROM menu ORDER BY menu_id"

    db.query(sql, (err, result)=>{
        if(err) throw err

        res.render('admin-panel-menu', {
            items: result
        })
    })
})

router.get('/panel/menu/add', ensureAuthenticated, (req,res)=>{
    res.render('menu-add', {
        items: '',
        errors: {},
        validatedData: {}
    })
})

router.post('/panel/menu/add', [
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
    
    const errors = validationResult(req)
    
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

router.get('/panel/menu/add-image', ensureAuthenticated, (req, res)=>{
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

router.post('/panel/menu/add-image', (req, res)=>{
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

router.get('/panel/menu/delete/:id', ensureAuthenticated, (req, res)=>{
    db.query("DELETE FROM menu WHERE menu_id = '"+req.params.id+"'", (err, result)=>{
        if(err) throw err

        if(result.affectedRows)
        {
            res.redirect('/admin/panel/menu')
        }
    })
})

router.get('/panel/orders', ensureAuthenticated, (res, req)=>{
    query = `SELECT concat(user.user_first_name, " ",user.user_last_name) AS name, menu.menu_name, meal.meal_id, meal.order_id, meal.user_id, meal.meal_price AS price FROM menu JOIN meal ON menu.menu_id=meal.menu_id JOIN user ON user.user_id=meal.user_id JOIN orders ON orders.order_id=meal.order_id ORDER BY meal.order_id DESC;`
    
    db.query(query, (err, result)=>{
        if(err) throw err
        
        console.log(result);

        req.render('admin-panel-orders', {
            items: result
        })
    })
})

router.get('/logout', (req, res)=>{
    user_present=0
    req.flash('success', 'you are logged out')
    res.redirect('/admin')
})

function ensureAuthenticated(req, res, next)
{
    console.log(res.locals.user);
    console.log(user_present);
    
    
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

module.exports = router;
