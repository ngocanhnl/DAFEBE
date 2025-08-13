const Account = require("../../models/account.model");
const systemConfig = require("../../config/system");
const md5 = require("md5");
//[GET] /admin/auth/login
module.exports.login = async (req,res)=>{
    res.render("admin/pages/auth/login",{
        pageTitle: "Login Page"
    });
}

//[POST] /admin/auth/login
module.exports.loginPost = async (req,res)=>{
    
    const email = req.body.email;
    const password = md5(req.body.password);
    //const password = req.body.password;
    const user = await Account.findOne(
        {   
            email: email,
            deleted: false
        });
    if(!user){
        req.flash("error","Tai khoan khong ton tai");
        res.redirect("back");
        return;
    }
    if(password != user.password){
        req.flash("error","Sai password");
        res.redirect("back");
        return;
    }
    if(user.status == "inactive"){
        req.flash("error","Tai khoan bi khoa");
        res.redirect("back");
        return;
    }
    res.cookie("token",user.token);
    res.redirect(`/${systemConfig.prefixAdmin}/dashboard`);
}

//[GET] /admin/auth/logout
module.exports.logout = async (req,res)=>{
    res.clearCookie("token");
    res.redirect(`/${systemConfig.prefixAdmin}/auth/login`);
}