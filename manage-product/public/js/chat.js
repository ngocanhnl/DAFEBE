import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'
// FileUploadWithPreview
const upload = new FileUploadWithPreview.FileUploadWithPreview("upload-image", {
    multiple: true,
    maxFileCount: 6
  });
// End FileUploadWithPreview

//CLIENT_SEND_MESSAGE
const formSendData = document.querySelector(".inner-form");
if(formSendData){
    formSendData.addEventListener("submit", (e) => {
        e.preventDefault();
        const content = e.target.elements.content.value;
        const images = upload.cachedFileArray || [];
        //Gửi tin nhắn hoặc ảnh lên server
        if(content || images.length > 0){
            
            socket.emit("CLIENT_SEND_MESSAGE",{
                content: content,
                images: images
            });
            e.target.elements.content.value = "";
            upload.resetPreviewPanel(); // clear all selected images
            
        
            socket.emit("CLIENT_SEND_TYPING", "hidden");
        }
        
        
    })
}
//END CLIENT_SEND_MESSAGE

//SERVER RETURN MESSAGE
socket.on("SERVER_RETURN_MESSAGE",(data)=>{
    const myId = document.querySelector("[my-id]").getAttribute("my-id");
    const body = document.querySelector(".chat .inner-body");
    let htmlFullName = "";
    let htmlContent = "";
    let htmlImages = "";
    const boxTyping = document.querySelector(".inner-list-typing");
    const div = document.createElement("div");

    if(myId == data.userId){
        div.classList.add("inner-outgoing");
    }
    else{
        div.classList.add("inner-incoming");
        htmlFullName = `<div class="inner-name">${data.fullName}</div>`;
    }
    if(data.content){
        htmlContent = `
        <div class="inner-content">${data.content}</div>
      `;
    }
    if(data.images) {
        htmlImages += `<div class="inner-images">`;
    
        for (const image of data.images) {
          htmlImages += `
            <img src="${image}">
          `;
        }
    
        htmlImages += `</div>`;
      }
    div.innerHTML = `
    ${htmlFullName}
    ${htmlContent}
    ${htmlImages}
    `;
    console.log(div);
    body.insertBefore(div, boxTyping);
    

    body.scrollTop = body.scrollHeight;
    // Preview Image
    const boxImages = div.querySelector(".inner-images");
    if(boxImages) {
        const gallery = new Viewer(boxImages);
    }
})
//END SERVER RETURN MESSAGE

//Scroll to bottom of chat
const bodyChat = document.querySelector(".chat .inner-body");
if(bodyChat){
    bodyChat.scrollTop = bodyChat.scrollHeight;
}
//End Scroll to bottom of chat

//show TYPING
var timeOutTyping;
const showTyping = ()=>{
    socket.emit("CLIENT_SEND_TYPING","show");

    clearTimeout(timeOutTyping);
    timeOutTyping = setTimeout(()=>{
        socket.emit("CLIENT_SEND_TYPING","hidden");
    },3000);

}
//end show TYPING




//Icon chat
const buttonIcon = document.querySelector('.button-icon')
const tooltip = document.querySelector('.tooltip')
Popper.createPopper(buttonIcon, tooltip)
buttonIcon.onclick = () => {
    tooltip.classList.toggle('shown')
}
  
const emojiPicker = document.querySelector('emoji-picker');
if(emojiPicker){
    const inputChat = document.querySelector(".chat .inner-foot input[name='content']");
    emojiPicker.addEventListener('emoji-click', (event)=>{
        const icon = event.detail.unicode;
        if(inputChat) {
            inputChat.value = inputChat.value + icon;
            const end = inputChat.value.length;
            inputChat.setSelectionRange(end, end);
            inputChat.focus();

            showTyping();
        }
    });
    inputChat.addEventListener("keyup", () => {
        console.log("CLIENT_SEND_TYPING");
        showTyping();
    });
    
}
//End Icon chat

//SERVER RETURN TYPING
const elementsListTyping = document.querySelector(".chat .inner-list-typing");
if(elementsListTyping){
    socket.on("SERVER_RETURN_TYPING",(data)=>{
        if(data.type == "show"){
            const exitTyping = elementsListTyping.querySelector(`[user-id="${data.userId}"]`);
            if(!exitTyping){
                const bodyChat = document.querySelector(".chat .inner-body");
                const boxTyping = document.createElement("div");
                boxTyping.classList.add("box-typing");
                boxTyping.setAttribute("user-id",data.userId);

                boxTyping.innerHTML = `
                    <div class="inner-name">${data.fullName}</div>
                    <div class="inner-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
                elementsListTyping.appendChild(boxTyping);
                bodyChat.scrollTop = bodyChat.scrollHeight;
            }
        }
        else{
            const boxTypingRemove = elementsListTyping.querySelector(`[user-id="${data.userId}"]`);
            if(boxTypingRemove){
                elementsListTyping.removeChild(boxTypingRemove);
            }
        }
    })
}

//END SERVER RETURN TYPING

// Preview Image
const chatBody = document.querySelector(".chat .inner-body");

if(chatBody) {
  const gallery = new Viewer(chatBody);
}
// End Preview Image