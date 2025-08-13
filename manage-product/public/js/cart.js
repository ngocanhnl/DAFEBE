//cập nhật số lượng sản phẩm trong giỏ hàng
const inputQuantity = document.querySelectorAll('input[name="quantity"]');
if(inputQuantity.length > 0){
    inputQuantity.forEach(button=>{
        button.addEventListener("change", (e)=>{
            const productId = button.getAttribute("product-id");
            const quantity = parseInt(button.value);
            if(quantity > 0){
                window.location.href = `/cart/update/${productId}/${quantity}`;
            }
        })
    })

}

//Hết cập nhật số lượng sản phẩm trong giỏ hàng