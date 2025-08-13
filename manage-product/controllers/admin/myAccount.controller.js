const Account = require("../../models/account.model");



//[GET] /admin/my-account
module.exports.index = async(req,res)=>{
    res.render("admin/pages/my-account/index");
}

//[GET] /admin/my-account/edit
module.exports.edit = async(req,res)=>{
    res.render("admin/pages/my-account/edit");
}

//[PATCH] /admin/my-account/edit
module.exports.editPatch = async(req,res)=>{
    await Account.updateOne({_id: res.locals.user.id}, req.body);
    res.redirect("back");
}

