const buttonsStatus = document.querySelectorAll("[button-status]");

if(buttonsStatus.length > 0){
    let url = new URL(window.location.href);
    buttonsStatus.forEach(button =>{
        button.addEventListener("click",()=>{
            const status = button.getAttribute("button-status");
            if(status != ""){
                url.searchParams.set("status",status);
            }
            else{
                url.searchParams.delete("status");
            }
            window.location.href = url.href;
        });
    });
}

//search
const formSearch = document.querySelector("#form-search");
if(formSearch){
    let url = new URL(window.location.href);
    console.log(url);
    formSearch.addEventListener("submit",(e)=>{
        e.preventDefault();
       
        const value = e.target.elements.keyword.value;
        
        if(value!=""){
            url.searchParams.set("keyword",value);

        }
        else{
            url.searchParams.delete("keyword");
        } 
        
        window.location.href = url.href;
    });
}

//end search

//pagination
const buttonPages = document.querySelectorAll("[button-pagination]");
if(buttonPages.length>0){
    let url = new URL(window.location.href);
    buttonPages.forEach((button)=>{
        button.addEventListener("click",()=>{
            const currentPage = button.getAttribute("button-pagination");
            url.searchParams.set("page",currentPage);
            window.location.href = url.href;
        })
    });
}

//end pagination

//Change-Status
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]");
if(buttonsChangeStatus.length > 0){
    const formChangeStatus = document.querySelector("#form-change-status");
    const path = formChangeStatus.getAttribute("data-path");
    buttonsChangeStatus.forEach((button)=>{
        button.addEventListener("click",()=>{
            const currentStatus = button.getAttribute("data-status");
            const currentId = button.getAttribute("data-id");
            const statusChange = currentStatus == "active"?"inactive":"active";
            const action = path+`/${statusChange}/${currentId}?_method=PATCH`;
            formChangeStatus.action = action;
            formChangeStatus.submit();
        })
    })

}

//End change-Status

//Change-Multi
const checkBoxMulti = document.querySelector("[checkbox-multi]");
if(checkBoxMulti){
    const checkAllButton = checkBoxMulti.querySelector("input[name='checkall']");
    const checkItemButton = checkBoxMulti.querySelectorAll("input[name='id']");
    checkAllButton.addEventListener("click",()=>{
        if(checkAllButton.checked){
            checkItemButton.forEach(button=>{
                button.checked = true;
            })
        }
        else{
            checkItemButton.forEach(button=>{
                button.checked = false;
            })
        }
    });

    checkItemButton.forEach(button=>{
        button.addEventListener("click",()=>{
            const countButtonCheck = checkBoxMulti.querySelectorAll("input[name='id']:checked").length;
            if(countButtonCheck == checkItemButton.length){
                checkAllButton.checked = true;
            }
            else{
                checkAllButton.checked = false;
            }
        });
    });
}

// End Change-Multi

//Form-change-Multi

const formChangeMulti = document.querySelector("[form-change-multi]");
if(formChangeMulti){
    formChangeMulti.addEventListener("submit",(e)=>{
        e.preventDefault();
        const checkBoxMulti = document.querySelector("[checkbox-multi]");
        const checkedItemButton = checkBoxMulti.querySelectorAll("input[name='id']:checked");
        const typeChange = e.target.elements.type.value;
        if(checkedItemButton.length > 0){
            const idsInput = formChangeMulti.querySelector("[name='ids']");
            let ids = [];
            checkedItemButton.forEach(button =>{
                const id = button.value;
                if(typeChange == "change-position"){
                    const idx = button.closest("tr").querySelector("input[name='position']").value;
                    ids.push(id+'-'+idx);
                    
                }
                else{
                    ids.push(id);
                }
                
                    
            })
            idsInput.value = ids.join(", ");
            formChangeMulti.submit();
        }
        else{
            alert("Choose some product")
        }
    });
}
//End Form-change-Multi

//Delete Item
const deleteButtons = document.querySelectorAll("[delete-button]");
if(deleteButtons.length > 0){
    const formDeleteItem = document.querySelector("#form-delete-item");
    const path = formDeleteItem.getAttribute("data-path");
    deleteButtons.forEach(button=>{
        button.addEventListener("click",()=>{
            const dataId = button.getAttribute("data-id"); 
            const action = path + `/${dataId}?_method=DELETE`;
            formDeleteItem.action = action;
            formDeleteItem.submit();
        });
    })
}



//End Delete Item

// End Change Status

// Show Alert
const showAlert = document.querySelector("[show-alert]");
if(showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time")) || 3000;
  const closeAlert = showAlert.querySelector("[close-alert]");

  setTimeout(() => {
    showAlert.classList.add("alert-hidden");
  }, time);

  closeAlert.addEventListener("click", () => {
    showAlert.classList.add("alert-hidden");
  });
}
// End Show Alert

//Upload IMAGE
const uploadImage = document.querySelector("[upload-image]")
if(uploadImage){
    const uploadImageInput = uploadImage.querySelector("[upload-image-input]");
    const uploadImagePreview = uploadImage.querySelector("[upload-image-preview]");
   
    uploadImageInput.addEventListener("change",(e)=>{
        if (e.target.files.length) {
            const image = URL.createObjectURL(e.target.files[0]);
            
            uploadImagePreview.src = image;
          }
    })
}

// END Upload IMAGE
// SORT
const  sort = document.querySelector("[sort]");
let url = new URL(window.location.href);
    //Sap xep
if(sort){
    
    const sortSelect = sort.querySelector("[sort-select]");
    const sortClear = sort.querySelector("[sort-clear]");
    sortSelect.addEventListener("change",(e)=>{
        const value = e.target.value;
        const [sortKey,sortValue] = value.split("-");
        url.searchParams.set("sortKey",sortKey);
        url.searchParams.set("sortValue",sortValue);
        window.location.href = url.href;
        
    })

    //End sap xep
    //Clear
    
    sortClear.addEventListener("click",()=>{
        url.searchParams.delete("sortKey");
        url.searchParams.delete("sortValue");
        window.location.href = url.href;
    })
    //End Clear

    
    //Lua chon mac dinh
    const sortKey = url.searchParams.get("sortKey");
    const sortValue = url.searchParams.get("sortValue");
    if( sortKey && sortValue ){
        const stringSort = `${sortKey}-${sortValue}`;
        const chooseOption = sort.querySelector(`option[value='${stringSort}']`);
        chooseOption.selected = true;
    }

    //END Lua chon mac dinh
}
// END SORT