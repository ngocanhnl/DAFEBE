

const InvoiceReducer = (current, action) => {
    switch (action.type) { 
        case 'selectInvoice':
            return action.payload

        default:
        
    }
    return current;
};

export default InvoiceReducer;
