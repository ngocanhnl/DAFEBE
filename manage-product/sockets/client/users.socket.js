const RoomChat = require("../../models/room-chat.model");
const User = require("../../models/user.model");



module.exports = async (res) =>{
    _io.once('connection',(socket)=>{
        
        socket.on("CLIENT_ADD_FRIEND", async (userId)=>{
            const myUserId = res.locals.user.id;
            // Thêm id của A vào acceptFriends của B
            const exitsAinB = await User.findOne({
                _id: userId,
                acceptFriends: myUserId
            });
            if(!exitsAinB){
                await User.updateOne({
                    _id: userId
                },
                {
                    $push: {acceptFriends: myUserId}
                })
            }

            // Thêm id của B vào requestFriends của A
            const exitsBinA = await User.findOne({
                _id: myUserId,
                requestFriends: userId
            });
            if(!exitsBinA){
                await User.updateOne({
                    _id: myUserId
                },
                {
                    $push: {requestFriends: userId}
                })
            }

            //Cập nhật danh sách kết bạn cho B
            const userB = await User.findOne({
                _id: userId
            });
            if(userB){
                const acceptFriendsLength = userB.acceptFriends.length;
                socket.broadcast.emit("SERVER_SEND_ACCEPT_FRIEND_LENGTH",{
                    userId: userId,
                    acceptFriendsLength: acceptFriendsLength
                });
            }
             //Lấy thông tin của A trả về B để hiển thị
             const infoUserA = await User.findOne({
                _id: myUserId
                }).select("id avatar fullName");
            socket.broadcast.emit("SERVER_RETURN_ACCEPT_FRIEND_INFO",{
                    userId: userId,
                    infoUserA: infoUserA
            });
        })
        socket.on("CLIENT_CANCEL_FRIEND", async (userId)=>{
            
            const myUserId = res.locals.user.id;
            // Xóa id của A trong acceptFriends của B
            const exitsAinB = await User.findOne({
                _id: userId,
                acceptFriends: myUserId
            });
            if(exitsAinB){
                await User.updateOne({
                    _id: userId
                },
                {
                    $pull: {acceptFriends: myUserId}
                })
            }

            // Xóa id của B trong requestFriends của A
            const exitsBinA = await User.findOne({
                _id: myUserId,
                requestFriends: userId
            });
            if(exitsBinA){
                await User.updateOne({
                    _id: myUserId
                },
                {
                    $pull: {requestFriends: userId}
                });
            }

            //Cập nhật danh sách kết bạn cho B
            const userB = await User.findOne({
                _id: userId
            });
            if(userB){
                const acceptFriendsLength = userB.acceptFriends.length;
                socket.broadcast.emit("SERVER_SEND_ACCEPT_FRIEND_LENGTH",{
                    userId: userId,
                    acceptFriendsLength: acceptFriendsLength
                });
            }
            //Lấy userId của A trả về cho B để xóa A ra khỏi ds hiển thị
            socket.broadcast.emit("SERVER_RETURN_USER_ID_CANCELED_ADD_FRIEND",{
                userId: userId,
                userIdA: myUserId
            })
           


        });
        socket.on("CLIENT_REFUSE_FRIEND", async (userId)=>{
            
            const myUserId = res.locals.user.id;
            //Xóa id của A trong request friend list của B
            const exitsAinB = User.findOne({
                _id: userId,
                requestFriends: myUserId
            });
            if(exitsAinB){
                await User.updateOne({
                    _id: userId
                },
                {
                    $pull:{ requestFriends: myUserId}
                });
            }
            //Xóa id của B trong accept friend list của A
            const exitsBinA = User.findOne({
                _id: myUserId,
                acceptFriends: userId
            });
            if(exitsBinA){
                await User.updateOne({
                    _id: myUserId
                },
                {
                    $pull:{ acceptFriends: userId}
                });
            }
        });
        socket.on("CLIENT_ACCEPT_FRIEND", async (userId)=>{
            const myUserId = res.locals.user.id;

            const exitsAinB = User.findOne({
                _id: userId,
                requestFriends: myUserId
            });
            let roomChat;
            const exitsBinA = User.findOne({
                _id: myUserId,
                acceptFriends: userId
            });

            if(exitsAinB && exitsBinA){
                roomChat = new RoomChat({
                    typeRoom: "friend",
                    users: [
                      {
                        user_id: userId,
                        role: "superAdmin"
                      },
                      {
                        user_id: myUserId,
                        role: "superAdmin"
                      }
                    ]
                });
                await roomChat.save();
                
            }


            //Xóa id của A trong request friend list của B
            
            if(exitsAinB){
                await User.updateOne({
                    _id: userId
                },
                {   
                    $push: {
                        friendList: {
                          user_id: myUserId,
                          room_chat_id: roomChat.id
                        }
                    },
                    $pull:{ requestFriends: myUserId}
                });
            }
            //Xóa id của B trong accept friend list của A
            
            if(exitsBinA){
                await User.updateOne({
                    _id: myUserId
                },
                {
                    $push: {
                        friendList: {
                          user_id: userId,
                          room_chat_id: roomChat.id
                        }
                    },
                    $pull:{ acceptFriends: userId}
                });
            }
            //Thêm B vào danh sách bạn của A
            
        });
        
    });
}