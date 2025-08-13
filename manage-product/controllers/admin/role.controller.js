const Role = require("../../models/role.model");
const systemConfig = require("../../config/system");

//[GET] /admin/roles
module.exports.index = async (req,res)=>{
    const records = await Role.find({deleted:false});
    res.render("admin/pages/roles/index",{
        pageTitle:"Tong quan",
        records: records
    });
}


//[GET] /admin/roles/create
module.exports.create = async (req,res)=>{
    res.render("admin/pages/roles/create",{
        pageTitle:"Tong quan"
    });
}

//[POST] /admin/roles/create
module.exports.createPost = async (req,res)=>{
    console.log(req.body);
    const newRole = new Role(req.body);
    await newRole.save();
    res.redirect(`/${systemConfig.prefixAdmin}/roles`);
}

//[GET] /admin/roles/edit/:id
module.exports.edit = async (req,res)=>{
    const id = req.params.id;
    const record = await Role.findOne({_id:id,deleted: false});
    // console.log(record);
    // res.send("123");
    res.render("admin/pages/roles/edit",{
        pageTitle:"Tong quan",
        data: record
    });
    
}

//[PATCH] /admin/roles/edit/:id
module.exports.editPatch = async (req,res)=>{
    const id = req.params.id;
    const record = await Role.updateOne({_id:id},req.body);
    res.redirect("back");
}

//[GET] /admin/roles/permission
module.exports.permission = async (req,res)=>{
    const records = await Role.find({deleted:false});
    res.render("admin/pages/roles/permission",{
        pageTitle:"Tong quan",
        records: records
    })
}
//[PATCH] /admin/roles/permission
module.exports.permissionPatch = async (req,res)=>{
    console.log(req.body);
    const permissions = JSON.parse(req.body.permissions);
    console.log(permissions);
    for(item of permissions){
        await Role.updateOne(
            {
                _id: item.id
            },
            {
                permission: item.permission
            }
        )
    }
    res.redirect("back");
}