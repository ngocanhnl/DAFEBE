const User = require("../../models/user.model");
const systemConfig = require("../../config/system");
const md5 = require("md5");

//[GET] /users
module.exports.index = async (req, res) => {
    try {
        const records = await User.find({ deleted: false }).sort({ createdAt: -1 });
        
        res.render("admin/pages/users/index", {
            pageTitle: "Quản lý người dùng",
            records: records
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Lỗi server");
    }
};

//[GET] /users/create
module.exports.create = async (req, res) => {
    try {
        res.render("admin/pages/users/create", {
            pageTitle: "Thêm mới người dùng"
        });
    } catch (error) {
        console.error("Error loading create form:", error);
        res.status(500).send("Lỗi server");
    }
};

//[POST] /users/create
module.exports.createPost = async (req, res) => {
    try {
        // Mã hóa password
        req.body.password = md5(req.body.password);
        
        // Xử lý avatar nếu có
        if (req.file) {
            req.body.avatar = req.file.path;
        }
        
        const newUser = new User(req.body);
        await newUser.save();
        
        req.flash("success", "Thêm mới người dùng thành công!");
        res.redirect(`/${systemConfig.prefixAdmin}/users`);
    } catch (error) {
        console.error("Error creating user:", error);
        req.flash("error", "Có lỗi xảy ra khi tạo người dùng!");
        res.redirect("back");
    }
};

//[GET] /users/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const id = req.params.id;
        const record = await User.findOne({
            deleted: false,
            _id: id
        });

        if (!record) {
            req.flash("error", "Không tìm thấy người dùng!");
            return res.redirect(`/${systemConfig.prefixAdmin}/users`);
        }

        res.render("admin/pages/users/edit", {
            pageTitle: "Chỉnh sửa người dùng",
            data: record
        });
    } catch (error) {
        console.error("Error loading edit form:", error);
        res.status(500).send("Lỗi server");
    }
};

//[PATCH] /users/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Nếu có password mới thì mã hóa
        if (req.body.password) {
            req.body.password = md5(req.body.password);
        } else {
            delete req.body.password;
        }

        // Xử lý avatar nếu có
        if (req.file) {
            req.body.avatar = req.file.path;
        }

        await User.updateOne({ _id: id }, req.body);
        
        req.flash("success", "Cập nhật người dùng thành công!");
        res.redirect(`/${systemConfig.prefixAdmin}/users`);
    } catch (error) {
        console.error("Error updating user:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật!");
        res.redirect("back");
    }
};

//[DELETE] /users/delete/:id
module.exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        await User.updateOne(
            { _id: id },
            { 
                deleted: true,
                deletedAt: new Date()
            }
        );
        
        req.flash("success", "Xóa người dùng thành công!");
        res.redirect("back");
    } catch (error) {
        console.error("Error deleting user:", error);
        req.flash("error", "Có lỗi xảy ra khi xóa!");
        res.redirect("back");
    }
};

//[PATCH] /users/change-status/:id
module.exports.changeStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.params.status;
        
        await User.updateOne(
            { _id: id },
            { status: status }
        );
        
        req.flash("success", "Cập nhật trạng thái thành công!");
        res.redirect("back");
    } catch (error) {
        console.error("Error changing status:", error);
        req.flash("error", "Có lỗi xảy ra khi cập nhật trạng thái!");
        res.redirect("back");
    }
};

//[GET] /users/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        const record = await User.findOne({
            deleted: false,
            _id: id
        });

        if (!record) {
            req.flash("error", "Không tìm thấy người dùng!");
            return res.redirect(`/${systemConfig.prefixAdmin}/users`);
        }

        res.render("admin/pages/users/detail", {
            pageTitle: "Chi tiết người dùng",
            data: record
        });
    } catch (error) {
        console.error("Error loading user detail:", error);
        res.status(500).send("Lỗi server");
    }
};
