import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { authApis, endpoints } from "../configs/Apis";

const ClassTransfer = ({ currentClassId, onTransferComplete }) => {
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [transferRequest, setTransferRequest] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Lấy danh sách lớp có thể chuyển đến
    const fetchAvailableClasses = async () => {
        console.log(currentClassId);
        try {
            setLoading(true);
        
            const response = await authApis().get(endpoints.availableClasses(currentClassId));

           
            if (response.data.success) {
                setAvailableClasses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching available classes:', error);
            toast.error('Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    // Lấy thông tin yêu cầu chuyển lớp hiện tại
    const fetchTransferRequest = async () => {
        try {
            // const response = await axios.get(`/api/enrollments/transfer-request/${currentClassId}`, {
            //     headers: {
            //         'Authorization': `Bearer ${localStorage.getItem('token')}`
            //     }
            // });
            const response = await authApis().get(endpoints.transferRequestDetail(currentClassId));
            if (response.data.success && response.data.data.requested) {
                setTransferRequest(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching transfer request:', error);
        }
    };

    useEffect(() => {
        fetchAvailableClasses();
        fetchTransferRequest();
    }, [currentClassId]);

    // Gửi yêu cầu chuyển lớp
    const handleSubmitTransferRequest = async (e) => {
        e.preventDefault();
        
        if (!selectedClass) {
            toast.error('Vui lòng chọn lớp học đích');
            return;
        }

        if (!reason.trim()) {
            toast.error('Vui lòng nhập lý do chuyển lớp');
            return;
        }

        try {
            setLoading(true);
        
            const response = await authApis().post(endpoints.transferRequest, {
                currentClassId,
                targetClassId: selectedClass,
                reason: reason.trim()
            });
            
            if (response.data.success) {
                toast.success(response.data.message);
                setShowForm(false);
                setSelectedClass('');
                setReason('');
                fetchTransferRequest(); // Cập nhật trạng thái yêu cầu
                if (onTransferComplete) {
                    onTransferComplete();
                }
            }
        } catch (error) {
            console.error('Error submitting transfer request:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Hủy yêu cầu chuyển lớp
    const handleCancelTransferRequest = async () => {
        if (!transferRequest) return;

        try {
            setLoading(true);
            const response = await axios.delete(`/api/enrollments/transfer-request/${currentClassId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                toast.success('Đã hủy yêu cầu chuyển lớp');
                setTransferRequest(null);
                setShowForm(true);
            }
        } catch (error) {
            console.error('Error canceling transfer request:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge bg-warning">Chờ duyệt</span>;
            case 'pending_teacher_approval':
                return <span className="badge bg-info">Chờ giáo viên duyệt</span>;
            case 'approved':
                return <span className="badge bg-success">Đã duyệt</span>;
            case 'rejected':
                return <span className="badge bg-danger">Đã từ chối</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'pending':
                return 'Yêu cầu của bạn đang chờ admin duyệt.';
            case 'pending_teacher_approval':
                return 'Yêu cầu đã được admin duyệt. Đang chờ giáo viên phụ trách lớp đích duyệt để vào lớp.';
            case 'approved':
                return 'Yêu cầu chuyển lớp đã được duyệt thành công!';
            case 'rejected':
                return 'Yêu cầu chuyển lớp đã bị từ chối.';
            default:
                return 'Trạng thái không xác định.';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h5 className="mb-0">
                    <i className="fas fa-exchange-alt me-2"></i>
                    Yêu cầu chuyển lớp học
                </h5>
            </div>
            <div className="card-body">
                {transferRequest ? (
                    <div className="transfer-request-status">
                        <div className="alert alert-info">
                            <h6>Yêu cầu chuyển lớp của bạn</h6>
                            <p><strong>Trạng thái:</strong> {getStatusBadge(transferRequest.status)}</p>
                            <p><strong>Lý do:</strong> {transferRequest.reason}</p>
                            <p><strong>Ngày yêu cầu:</strong> {new Date(transferRequest.requested_date).toLocaleDateString('vi-VN')}</p>
                            <p><strong>Thông báo:</strong> {getStatusMessage(transferRequest.status)}</p>
                            
                            {transferRequest.status === 'pending' && (
                                <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={handleCancelTransferRequest}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Hủy yêu cầu'}
                                </button>
                            )}
                            
                            {transferRequest.status === 'rejected' && transferRequest.notes && (
                                <div className="mt-2">
                                    <strong>Lý do từ chối:</strong> {transferRequest.notes}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {!showForm ? (
                            <div className="text-center">
                                <p>Bạn muốn chuyển sang lớp học khác?</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowForm(true)}
                                >
                                    <i className="fas fa-plus me-2"></i>
                                    Tạo yêu cầu chuyển lớp
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitTransferRequest}>
                                <div className="mb-3">
                                    <label className="form-label">Chọn lớp học đích:</label>
                                    <select 
                                        className="form-select"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn lớp học --</option>
                                        {availableClasses.map((classItem) => (
                                            <option key={classItem._id} value={classItem._id}>
                                                {classItem.class_name} - {classItem.instructor_id?.fullName} 
                                                (Còn {classItem.available_slots} chỗ)
                                                {classItem.status === 'ongoing' && ' - Đang diễn ra'}
                                            </option>
                                        ))}
                                    </select>
                                    {availableClasses.length === 0 && !loading && (
                                        <small className="text-muted">Không có lớp học nào có thể chuyển đến</small>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Lý do chuyển lớp:</label>
                                    <textarea 
                                        className="form-control"
                                        rows="3"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Nhập lý do bạn muốn chuyển lớp..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="d-flex gap-2">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={loading || availableClasses.length === 0}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane me-2"></i>
                                                Gửi yêu cầu
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowForm(false)}
                                        disabled={loading}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {loading && availableClasses.length === 0 && (
                    <div className="text-center mt-3">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Đang tải danh sách lớp học...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassTransfer;
