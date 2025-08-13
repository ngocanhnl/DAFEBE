const uploadTOCloudinary = require("../../helper/uploadImageToCloudinary");

module.exports.upload = async (req, res, next)=>{
    if(req.file){
        const result = await uploadTOCloudinary(req.file.buffer);
        
        req.body[req.file.fieldname] = result;
    }
    next();
    
}

