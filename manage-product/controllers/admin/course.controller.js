const Course = require("../../models/course.model");
const CourseCategory = require("../../models/course-category.model");
const Account = require("../../models/account.model");
const Role = require("../../models/role.model");

const createTree = require("../../helper/createTree");
const filterStatusHelper = require("../../helper/filterStatus");
const searchHelper = require("../../helper/search");
const pagination = require("../../helper/pagination");
const systemConfig = require("../../config/system");

//[GET] /admin/course
module.exports.index = async(req,res)=>{
    const filterStatus = filterStatusHelper(req.query);
    
    let objSearch = searchHelper(req.query);

    let find = {
        deleted: false
    };
    if(req.query.status) {
        find.status = req.query.status;
    }
    if(req.query.keyword) {
        find.title = objSearch.regex;
    }
    
    let sort={};
    if(req.query.sortKey && req.query.sortValue !=""){
        sort[req.query.sortKey] = req.query.sortValue;
    }
    else{
        sort.position = "desc";
    }
    let initPagination = {
        currentPage: 1,
        limitItem: 5
    }
    let countCourse = await Course.count(find);
    const paginationObject = pagination(initPagination,req.query,countCourse);
    const courses = await Course.find(find)
        .sort(sort)
        .limit(paginationObject.limitItem)
        .skip(paginationObject.skip);

    
    for(const course of courses){

        //Lấy ra người tạo
        const userCreate = await Account.findOne({
            _id: course.createdBy.account_id
        });
        if(userCreate){
            course.createdBy.accountFullName = userCreate.fullName;
        }

         //Lấy ra người sửa
        const updatedUserid = course.updatedBy.slice(-1)[0];
        if(updatedUserid){
            const updatedUser = await Account.findOne({_id: updatedUserid.account_id});
            if(updatedUser){
                updatedUserid.accountFullName = updatedUser.fullName;
            }
        }
    }

   


    if(countCourse > 0 && courses.length == 0){
        let hrefString = "";
        for(let key in req.query){
            if(key != "page"){
                hrefString += `&${key}=${req.query[key]}`;
            }
        }
        const href = `${req.baseUrl}?page=1${hrefString}`;
       
        res.redirect(href);   
    }
    else{
        
        res.render("admin/pages/courses/index.pug",{
            pageTitle: "Danh sách khóa học",
            courses: courses,
            filterStatus: filterStatus,
            keyword: objSearch.keyword,
            pagination: paginationObject
        });
     }
    

}

//[PATCH] /admin/course/change-status/:status/:id
module.exports.changeStatus = async(req,res)=>{
    if(res.locals.role.permission.includes("courses_edit")){
        const status = req.params.status;
        const id = req.params.id;


        const updatedBy = {
            account_id: res.locals.user.id,
            updatedAt: Date()
        };


        await Course.updateOne({_id:id},{status:status,$push:{ updatedBy: updatedBy}});
        req.flash("success", "Cập nhật trạng thái thành công!");
        res.redirect("back");
    }
    else{
        req.flash("error", "Không có quyền chỉnh sửa");
        res.redirect("back");
    }
    
    
}
//[PATCH] /admin/course/change-multi
module.exports.changeMulti = async(req,res)=>{
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
    const updatedBy = {
        account_id: res.locals.user.id,
        updatedAt: Date()
    };
    switch(type){
        case "active":
        case "inactive":
            await Course.updateMany({_id:{$in:ids}},{status:type,$push:{ updatedBy: updatedBy}});
            req.flash("success", `Cập nhật trạng thái thành công ${ids.length} bản ghi!`);
            break;
        case "delete":
            await Course.updateMany({_id:{$in:ids}},{deleted:true});
            req.flash("success", `Xóa thành công ${ids.length} bản ghi!`);
            break;
        case "change-position":
            console.log("123");
            for(const item of ids){
                const [id, position] = item.split("-");
                console.log(id);
                console.log(position);
                await Course.updateOne({_id:id},{position:position,$push:{ updatedBy: updatedBy}});
            }
            req.flash("success", `Thay đổi vị trí thành công ${ids.length} bản ghi!`);
            break;

        default:
            break;
    }
    
    res.redirect("back");
}

//[PATCH] /admin/course/delete
module.exports.delete = async(req,res)=>{
    const id = req.params.id;
    console.log(req);
    await Course.updateOne({_id:id},{
        deleted:true,
        deletedBy:{
            account_id: res.locals.user.id,
            deletedAt: new Date()
        }
    });
    res.redirect("back");
}

//[GET] /create
module.exports.createGet = async(req,res)=>{
    const find = {
        deleted: false
    }
    const records = await CourseCategory.find(find);
    const teacherRoleId = await Role.findOne({ title: "teacher" });
    const instructors = await Account.find({ 
        deleted: false, 
        status: "active",
        role_id: teacherRoleId._id // Assuming teacher role ID
    });
    console.log(teacherRoleId);
    console.log(instructors);
    const newRecords = createTree(records);
    res.render("admin/pages/courses/create.pug",{
        pageTitle: "Tạo khóa học mới",
        records: newRecords,
        instructors: instructors
    });
}

//[POST] /create
module.exports.createPOST = async(req,res)=>{
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.duration = parseInt(req.body.duration);
    if(req.body.position == ""){
        const cnt = await Course.countDocuments();
        req.body.position = cnt + 1;
    }
    else{
        req.body.position = parseInt(req.body.position);
    }
    req.body.createdBy = {
        account_id : res.locals.user.id
    }
    const newCourse = new Course(req.body);
    await newCourse.save();
    req.flash("success", `Tạo mới khóa học thành công!`);
    res.redirect(`/${systemConfig.prefixAdmin}/courses`);
}

//[GET] /edit/:id
module.exports.edit = async(req,res)=>{
    const id = req.params.id;
    const course = await Course.findOne({_id:id,deleted:false});
    const find = {
        deleted: false
    }
    const records = await CourseCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/courses/edit",{
        course: course,
        records: newRecords
    })
   
}

//[PATCH] /edit/:id
module.exports.editPatch = async(req,res)=>{
    const id = req.params.id;
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseFloat(req.body.discountPercentage);
    req.body.duration = parseInt(req.body.duration);
    req.body.position = parseInt(req.body.position);
    if(req.file && req.file.filename){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }

    const updatedBy = {
        account_id: res.locals.user.id,
        updatedAt: Date()
    };


    await Course.updateOne({_id:id},{
        ...req.body,
        $push: {updatedBy: updatedBy}
    });

    res.redirect("back");
}
//[GET] /detail
module.exports.detail = async(req,res)=>{
    try {
        const id = req.params.id;
        const course = await Course.findOne({_id:id,deleted:false});
        res.render("admin/pages/courses/detail",{
            course: course
        })
    } catch (error) {
        res.redirect(`/${systemConfig.prefixAdmin}/courses`);
    }
} 