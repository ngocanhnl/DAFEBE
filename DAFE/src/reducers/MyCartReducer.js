import cookie from 'react-cookies'

const MyCartReducer = (current, action) => {
    if (action.type === 'update') {
        let total = 0;

        let cart = cookie.load('cart') || null;
        if (cart) {
            for (let x of Object.values(cart))
                total += x['quantity'];
        }

        return total;
    }

    return current;
}

export default MyCartReducer;