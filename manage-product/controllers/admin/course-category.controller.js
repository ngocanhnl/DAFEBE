const CourseCategory = require("../../models/course-category.model");


const createTree = require("../../helper/createTree");

//[GET] /admin/courses-category
module.exports.index = async(req,res)=>{
    const find = {
        deleted: false
    }
    const records = await CourseCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/course-category/index.pug",{
        pageTitle: "Danh sách danh mục khóa học",
        records: newRecords
    });
}
//[GET] /admin/courses-category/create
module.exports.create = async(req,res)=>{
    const find = {
        deleted: false
    }
    const records = await CourseCategory.find(find);
    const newRecords = createTree(records);
    res.render("admin/pages/course-category/create.pug",{
        pageTitle: "Tạo danh mục khóa học mới",
        records: newRecords
    });
}
//[POST] /admin/courses-category/create
module.exports.createPost = async(req,res)=>{
   if(req.body.position == ""){
        const cnt = await CourseCategory.countDocuments();
        req.body.position = cnt + 1;
    }
    else{
        req.body.position = parseInt(req.body.position);
    }
    const newCourseCategory = new CourseCategory(req.body);
    await newCourseCategory.save();
    res.redirect(`back`);

}

//[GET] /admin/courses-category/edit/:id
module.exports.edit = async(req,res)=>{
    const id = req.params.id;
    const courseCategory = await CourseCategory.findOne({_id:id,deleted:false});
    const records = await CourseCategory.find({deleted:false});
    const newRecords = createTree(records);
    res.render("admin/pages/course-category/edit",{
        data: courseCategory,
        records: newRecords
    })
}

//[PATCH] /admin/courses-category/edit/:id
module.exports.editPatch = async(req,res)=>{
    const id = req.params.id;
    req.body.position = parseInt(req.body.position);
    if(req.file && req.file.filename){
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    await CourseCategory.updateOne({_id:id},req.body);

    res.redirect("back");
} 