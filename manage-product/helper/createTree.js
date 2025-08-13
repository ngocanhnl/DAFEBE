

let cnt = 0;

function createTree(arr, parentId=""){
    let tree=[];

    arr.forEach(item => {
        if(item.parent_id == parentId){
            cnt++;
            const newItem = item;
            newItem.index = cnt;
            const children = createTree(arr,item.id);
            if(children.length > 0){
                newItem.children = children;
            }
            tree.push(newItem);
        }
    });
    return tree;
}

module.exports = (arr, parentId="") =>{
    cnt = 0 ;
    const tree = createTree(arr,parentId="");
    return tree;
}