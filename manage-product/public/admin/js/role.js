//Permission
const tablePermissions = document.querySelector("[table-permissions]");
if(tablePermissions){
    const buttonSubmit = document.querySelector("[button-submit]");
    buttonSubmit.addEventListener("click", ()=>{
        let result = [];
        const rows = tablePermissions.querySelectorAll("[data-name]");
        rows.forEach(row=>{
            const name = row.getAttribute("data-name");
            const inputs = row.querySelectorAll("input");
            if(name == "id"){
                inputs.forEach(input=>{
                    result.push({
                        id: input.value,
                        permission: []
                    })
                })
            }
            else{
                inputs.forEach((input,index)=>{
                    if(input.checked){
                        result[index].permission.push(name);
                    }
                })
            }
        })
        const formChangepermissions = document.querySelector("#form-change-permissions");
        const inputPermission = formChangepermissions.querySelector("input");
        inputPermission.value = JSON.stringify(result);
        formChangepermissions.submit();
    })
}
//End Permission

//Defaut Permission
const dataRecord = document.querySelector("[data-records]");
console.log(dataRecord);
if(dataRecord){
    const records = JSON.parse(dataRecord.getAttribute("data-records"));
    records.forEach((item,index)=>{
        const permissions = item.permission;
        permissions.forEach(permission=>{
            const row = tablePermissions.querySelector(`tr[data-name="${permission}"]`);
            const input = row.querySelectorAll("input")[index];
            input.checked = true;
        })


    })
    console.log(records);
}
//End Defaut Permission