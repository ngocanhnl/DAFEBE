const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const systemConfig = require("../../config/system");
const md5 = require("md5");
//[GET] /account
module.exports.index = async (req,res)=>{
    const records = await Account.find({deleted: false});
    for(const record of records){
        const role = await Role.findOne({_id: record.role_id});
        record.role = role;
    }


    res.render("admin/pages/account/index",{
        pageTitle: "Danh sách tài khoản",
        records:records
    });
}

//[GET] /account/create
module.exports.create = async (req,res)=>{
    const roles = await Role.find({deleted: false});
    
    res.render("admin/pages/account/create",{
        pageTitle: "Tao moi tài khoản",
        roles: roles
    });
}

//[POST] /account/create
module.exports.createPost = async (req,res)=>{
    req.body.password = md5(req.body.password);
    const newAccount = new Account(req.body);
    await newAccount.save();
    res.redirect("back");
}

//[GET] /account/edit/:id
module.exports.edit = async (req,res)=>{
    const id = req.params.id;
    const roles = await Role.find({deleted: false});
    const record = await Account.findOne({
        deleted: false,
        _id: id
    });

    res.render("admin/pages/account/edit",{
        pageTitle: "cap nhat tài khoản",
        roles: roles,
        data: record
    });
}

//[Patch] /account/edit/:id
module.exports.editPatch = async (req,res)=>{
    if(req.body.password) {
        req.body.password = md5(req.body.password);
      } else {
        delete req.body.password;
      }
      console.log(req.body );
      await Account.updateOne({ _id: req.params.id }, req.body);
    
      res.redirect("back");

}