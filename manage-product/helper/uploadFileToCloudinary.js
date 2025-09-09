const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_KEY, 
    api_secret: process.env.CLOUD_API_SECRET
});

let streamUpload = (buffer, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder: 'lesson-files'
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

module.exports = async (buffer, resourceType = 'auto') => {
    let result = await streamUpload(buffer, resourceType);
    // return {
    //     url: result.url,
    //     public_id: result.public_id,
    //     format: result.format,
    //     size: result.bytes
    // };
     return {
        url: result.secure_url, 
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        resource_type: result.resource_type
    };
}
