const Class = require("../../models/class.model");
const Enrollment = require("../../models/enrollment.model");

// [GET] /api/livestream/debug - API debug để kiểm tra dữ liệu
module.exports.debugLivestream = async (req, res) => {
    try {
        const userId = req.userClient._id;
        
        // console.log('🔍 Debug API - User ID:', userId);
        
        // Kiểm tra enrollments
        const enrollments = await Enrollment.find({ 
            student_id: userId 
        }).populate('class_id');
        
        // console.log('🔍 Debug API - All enrollments:', enrollments.length);
        // console.log('🔍 Debug API - Enrollment statuses:', enrollments.map(e => e.status));
        
        // Kiểm tra classes có livestream
        const classesWithLivestream = await Class.find({
            'livestream.youtubeVideoId': { $exists: true, $ne: null }
        });
        
        // console.log('🔍 Debug API - Classes with livestream:', classesWithLivestream.length);
        
        res.json({
            success: true,
            debug: {
                userId,
                enrollmentsCount: enrollments.length,
                enrollmentStatuses: enrollments.map(e => ({
                    id: e._id,
                    status: e.status,
                    classId: e.class_id?._id,
                    className: e.class_id?.class_name
                })),
                classesWithLivestreamCount: classesWithLivestream.length,
                classesWithLivestream: classesWithLivestream.map(c => ({
                    id: c._id,
                    name: c.class_name,
                    livestream: c.livestream
                }))
            }
        });
    } catch (error) {
        console.error("Debug API error:", error);
        res.status(500).json({
            success: false,
            message: "Debug API error"
        });
    }
};

// [GET] /api/livestream/classes - Lấy danh sách lớp học có livestream của học sinh
module.exports.getMyLivestreams = async (req, res) => {
    try {
        const userId = req.userClient._id;
        
        // Lấy danh sách enrollment của học sinh
        const enrollments = await Enrollment.find({ 
            student_id: userId,
            status: { $in: ['approved', 'completed'] }
        }).populate({
            path: 'class_id',
            populate: [
                { path: 'course_id' },
                { path: 'instructor_id' }
            ]
        });
        

        // Lọc ra các lớp có livestream
        const classesWithLivestream = enrollments
            .filter(enrollment => 
                enrollment.class_id && 
                enrollment.class_id.livestream && 
                enrollment.class_id.livestream.youtubeVideoId
            )
            .map(enrollment => ({
                class_id: enrollment.class_id._id,
                class_name: enrollment.class_id.class_name,
                course_title: enrollment.class_id.course_id?.title || 'N/A',
                instructor_name: enrollment.class_id.instructor_id?.fullName || 'N/A',
                livestream: {
                    isLive: enrollment.class_id.livestream.isLive,
                    youtubeUrl: enrollment.class_id.livestream.youtubeUrl,
                    youtubeVideoId: enrollment.class_id.livestream.youtubeVideoId,
                    embedUrl: `https://www.youtube.com/embed/${enrollment.class_id.livestream.youtubeVideoId}`,
                    title: enrollment.class_id.livestream.title,
                    description: enrollment.class_id.livestream.description,
                    liveStartTime: enrollment.class_id.livestream.liveStartTime,
                    liveEndTime: enrollment.class_id.livestream.liveEndTime
                }
            }));

        // console.log('🔍 Debug - User ID:', userId);
        // console.log('🔍 Debug - Enrollments found:', enrollments.length);
        // console.log('🔍 Debug - Classes with livestream:', classesWithLivestream.length);
        // if (enrollments.length > 0) {
        //     console.log('🔍 Debug - Sample enrollment:', JSON.stringify(enrollments[0], null, 2));
        // }
        // if (classesWithLivestream.length > 0) {
        //     console.log('🔍 Debug - Sample livestream data:', JSON.stringify(classesWithLivestream[0], null, 2));
        // }
        
        res.json({
            success: true,
            data: classesWithLivestream
        });
    } catch (error) {
        console.error("Error getting my livestreams:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy danh sách livestream"
        });
    }
};

// [GET] /api/livestream/class/:classId - Lấy thông tin livestream của một lớp cụ thể
module.exports.getClassLivestream = async (req, res) => {
    try {
        const classId = req.params.classId;
        const userId = req.userClient._id;

                // Kiểm tra xem học sinh có đăng ký lớp này không
        const enrollment = await Enrollment.findOne({
            student_id: userId,
            class_id: classId,
            status: { $in: ['approved', 'completed'] }
        });
        
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập lớp học này"
            });
        }

        // Lấy thông tin lớp học
        const classData = await Class.findById(classId)
            .populate('course_id')
            .populate('instructor_id');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học"
            });
        }

        if (!classData.livestream || !classData.livestream.youtubeVideoId) {
            return res.json({
                success: true,
                data: {
                    class_info: {
                        class_id: classData._id,
                        class_name: classData.class_name,
                        course_title: classData.course_id?.title || 'N/A',
                        instructor_name: classData.instructor_id?.fullName || 'N/A'
                    },
                    livestream: null,
                    message: "Lớp học này chưa có livestream"
                }
            });
        }

        res.json({
            success: true,
            data: {
                class_info: {
                    class_id: classData._id,
                    class_name: classData.class_name,
                    course_title: classData.course_id?.title || 'N/A',
                    instructor_name: classData.instructor_id?.fullName || 'N/A'
                },
                livestream: {
                    isLive: classData.livestream.isLive,
                    youtubeUrl: classData.livestream.youtubeUrl,
                    youtubeVideoId: classData.livestream.youtubeVideoId,
                    embedUrl: `https://www.youtube.com/embed/${classData.livestream.youtubeVideoId}`,
                    title: classData.livestream.title,
                    description: classData.livestream.description,
                    liveStartTime: classData.livestream.liveStartTime,
                    liveEndTime: classData.livestream.liveEndTime
                }
            }
        });
    } catch (error) {
        console.error("Error getting class livestream:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy thông tin livestream"
        });
    }
};

// [GET] /api/livestream/active - Lấy danh sách livestream đang hoạt động
module.exports.getActiveLivestreams = async (req, res) => {
    try {
        const userId = req.userClient._id;
        
        // Lấy danh sách enrollment của học sinh
        const enrollments = await Enrollment.find({ 
            student_id: userId,
            status: { $in: ['approved', 'completed'] }
        }).populate({
            path: 'class_id',
            populate: [
                { path: 'course_id' },
                { path: 'instructor_id' }
            ]
        });

        // Lọc ra các lớp có livestream đang hoạt động
        const activeLivestreams = enrollments
            .filter(enrollment => 
                enrollment.class_id && 
                enrollment.class_id.livestream && 
                enrollment.class_id.livestream.youtubeVideoId &&
                enrollment.class_id.livestream.isLive
            )
            .map(enrollment => ({
                class_id: enrollment.class_id._id,
                class_name: enrollment.class_id.class_name,
                course_title: enrollment.class_id.course_id?.title || 'N/A',
                instructor_name: enrollment.class_id.instructor_id?.fullName || 'N/A',
                livestream: {
                    isLive: enrollment.class_id.livestream.isLive,
                    youtubeUrl: enrollment.class_id.livestream.youtubeUrl,
                    youtubeVideoId: enrollment.class_id.livestream.youtubeVideoId,
                    embedUrl: `https://www.youtube.com/embed/${enrollment.class_id.livestream.youtubeVideoId}`,
                    title: enrollment.class_id.livestream.title,
                    description: enrollment.class_id.livestream.description,
                    liveStartTime: enrollment.class_id.livestream.liveStartTime
                }
            }));

        console.log('🔍 Debug Active - User ID:', userId);
        console.log('🔍 Debug Active - Enrollments found:', enrollments.length);
        console.log('🔍 Debug Active - Active livestreams:', activeLivestreams.length);
        console.log('🔍 Debug Active - Sample active livestream:', activeLivestreams[0]);
        
        res.json({
            success: true,
            data: activeLivestreams
        });
    } catch (error) {
        console.error("Error getting active livestreams:", error);
        res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra khi lấy danh sách livestream đang hoạt động"
        });
    }
};
