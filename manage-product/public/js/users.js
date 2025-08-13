// Chức năng gửi yêu cầu kết bạn
const listBtnAddFriend = document.querySelectorAll("[btn-add-friend]");
if(listBtnAddFriend.length > 0){
    listBtnAddFriend.forEach((button)=>{
        button.addEventListener("click",()=>{
            button.closest(".box-user").classList.add("add");
            const userId = button.getAttribute("btn-add-friend");
            socket.emit("CLIENT_ADD_FRIEND",userId);
        })
    })
}


// Chức năng hủy gửi yêu cầu kết bạn
const listBtnCancelFriend = document.querySelectorAll("[btn-cancel-friend]");
console.log(listBtnCancelFriend);
if(listBtnCancelFriend.length > 0){
    
    listBtnCancelFriend.forEach((button)=>{
        button.addEventListener("click",()=>{
            button.closest(".box-user").classList.remove("add");
            const userId = button.getAttribute("btn-cancel-friend");
            socket.emit("CLIENT_CANCEL_FRIEND",userId);
            
        })
    })
}


//Chức năng không đồng ý kết bạn
const listBtnRefuseFriend = document.querySelectorAll("[btn-refuse-friend]");
if(listBtnRefuseFriend.length > 0){
    listBtnRefuseFriend.forEach((button)=>{
        button.addEventListener("click",()=>{
            button.closest(".box-user").classList.add("refuse");    
            const userId = button.getAttribute("btn-refuse-friend");

            socket.emit("CLIENT_REFUSE_FRIEND", userId);
            
        })
    })
}


//Chức năng đồng ý kết bạn
const listBtnAcceptFriend = document.querySelectorAll("[btn-accept-friend]");
if(listBtnAcceptFriend.length > 0){
    listBtnAcceptFriend.forEach((button)=>{
        button.addEventListener("click",()=>{
            button.closest(".box-user").classList.add("accepted");    
            const userId = button.getAttribute("btn-accept-friend");

            socket.emit("CLIENT_ACCEPT_FRIEND", userId);
            
        })
    })
}

//SERVER_SEND_ACCEPT_FRIEND_LENGTH
socket.on("SERVER_SEND_ACCEPT_FRIEND_LENGTH", (data)=>{
    const badgeUsersAccept = document.querySelector("[badge-users-accept]");
    const userId = badgeUsersAccept.getAttribute("badge-users-accept");
    if(userId == data.userId){
        badgeUsersAccept.innerHTML = data.acceptFriendsLength;
    }
});

// SERVER_RETURN_ACCEPT_FRIEND_INFO
socket.on("SERVER_RETURN_ACCEPT_FRIEND_INFO", (data)=>{
    //Trang lời mời kết bạn
    const dataUsersAccept = document.querySelector("[data-users-accept]");
    
    if(dataUsersAccept){
        const userId = dataUsersAccept.getAttribute("data-users-accept");
        if(userId == data.userId){
        
            //Vẽ ra giao diện
            const newBoxUser = document.createElement("div");
            
            newBoxUser.classList.add("col-6");
            newBoxUser.setAttribute("user-id", data.infoUserA._id);
            newBoxUser.innerHTML = `
                <div class="box-user">
                    <div class="inner-avatar">
                        <img src="/images/avatar.jpg" alt="${data.infoUserA.fullName}">
                    </div>
                    <div class="inner-info">
                        <div class="inner-name">${data.infoUserA.fullName}</div>
                        <div class="inner-buttons">
                            <button
                                class="btn btn-sm btn-primary mr-1"
                                btn-accept-friend="${data.infoUserA._id}"
                            >
                                Chấp nhận
                            </button>
                            <button
                                class="btn btn-sm btn-secondary mr-1"
                                btn-refuse-friend="${data.infoUserA._id}"
                            >
                                Xóa
                            </button>
                            <button
                                class="btn btn-sm btn-secondary mr-1"
                                btn-deleted-friend=""
                                disabled=""
                            >
                                Đã xóa
                            </button>
                            <button
                                class="btn btn-sm btn-primary mr-1"
                                btn-accepted-friend=""
                                disabled=""
                            >
                                Đã chấp nhận
                            </button>
                        </div>
                    </div>
                </div>
            
            `
            dataUsersAccept.appendChild(newBoxUser);
            //Cập nhật sự kiện
                //Xóa 
            const btnRefuseFriend = newBoxUser.querySelector("[btn-refuse-friend]");
            btnRefuseFriend.addEventListener("click", () => {
            btnRefuseFriend.closest(".box-user").classList.add("refuse");
    
            const userId = btnRefuseFriend.getAttribute("btn-refuse-friend");
    
            socket.emit("CLIENT_REFUSE_FRIEND", userId);
            });
                //Đồng ý
            const btnAcceptFriend = newBoxUser.querySelector("[btn-accept-friend]");
            btnAcceptFriend.addEventListener("click", () => {
            btnAcceptFriend.closest(".box-user").classList.add("accepted");
        
            const userId = btnAcceptFriend.getAttribute("btn-accept-friend");
        
            socket.emit("CLIENT_ACCEPT_FRIEND", userId);
            });
    
        }
    }
    
    //Trang danh sách người dùng
    const dataUsersNotFriend = document.querySelector("[data-users-not-friend]");
    if(dataUsersNotFriend){
        console.log(dataUsersNotFriend);
        const userId = dataUsersNotFriend.getAttribute("data-users-not-friend");
        if(userId == data.userId){
            
            const boxRemove = dataUsersNotFriend.querySelector(`[user-id="${data.infoUserA._id}"]`);
            console.log(boxRemove);
            if(boxRemove) {
                console.log("3");
                dataUsersNotFriend.removeChild(boxRemove);
            }
        }
    }
});

//SERVER_RETURN_USER_ID_CANCELED_ADD_FRIEND
socket.on("SERVER_RETURN_USER_ID_CANCELED_ADD_FRIEND",(data)=>{
    //Xóa A ra khỏi danh sách hiển thị của B sau khi A hủy gửi yêu cầu kết bạn
    const dataUsersAccept = document.querySelector("[data-users-accept]");
    if(dataUsersAccept){
        const userId = dataUsersAccept.getAttribute("data-users-accept");

        if(userId == data.userId){
            
            const boxRemove = dataUsersAccept.querySelector(`[user-id="${data.userIdA}"]`);
            if(boxRemove) {
                dataUsersAccept.removeChild(boxRemove);
            }
        }
    }
    
});

//SERVER_RETURN_ONLINE_STATUS
socket.on("SERVER_RETURN_ONLINE_STATUS",(userId)=>{
    const dataUserFriends = document.querySelector("[data-user-friends]");
    if(dataUserFriends){
        const boxUser = dataUserFriends.querySelector(`[user-id="${userId}"]`);
        if(boxUser){
            boxUser.querySelector("[status]").setAttribute("status","online");
        }
    }
});
//SERVER_RETURN_OFFLINE_STATUS
socket.on("SERVER_RETURN_OFFLINE_STATUS",(userId)=>{
    const dataUserFriends = document.querySelector("[data-user-friends]");
    if(dataUserFriends){
        const boxUser = dataUserFriends.querySelector(`[user-id="${userId}"]`);
        if(boxUser){
            boxUser.querySelector("[status]").setAttribute("status","offline");
        }
    }
});