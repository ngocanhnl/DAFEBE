module.exports = (paginationObject,query,countProduct)=>{
    if(query.page){
        paginationObject.currentPage = parseInt(query.page);
    }
    paginationObject.skip = (paginationObject.currentPage-1)*paginationObject.limitItem;
    paginationObject.totalPage = Math.ceil(countProduct/paginationObject.limitItem);
    return paginationObject;
}