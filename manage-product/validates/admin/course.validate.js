module.exports.createPost = (req,res,next)=>{
    if(!req.body.title){
        req.flash("error", "Vui lòng nhập tên khóa học!");
        res.redirect("back");
        return;
    }
    if(!req.body.price){
        req.flash("error", "Vui lòng nhập giá khóa học!");
        res.redirect("back");
        return;
    }
    if(!req.body.duration){
        req.flash("error", "Vui lòng nhập thời lượng khóa học!");
        res.redirect("back");
        return;
    }
    if(!req.body.instructor){
        req.flash("error", "Vui lòng nhập tên giảng viên!");
        res.redirect("back");
        return;
    }
    if(!req.body.level){
        req.flash("error", "Vui lòng chọn cấp độ khóa học!");
        res.redirect("back");
        return;
    }
    next();
} 