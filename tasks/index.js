//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
exports = {
    "mint": require("./rec/mint"),
    "getAddress": require("./get-address"),
    "redeem": require("./rec/redeem"),
    "getBalance": require('./rec/get-balance'),
    "setRole": require('./rec/set-role'),
    "buyRecs": require('./marketplace/buy-recs'),
    "listRecs": require('./marketplace/list-recs'),
    "getListedRecs": require('./marketplace/get-listed-recs'),
    "tmpbuyRecs": require('./rec-marketplace/buy-recs'),
    "tmpListRecs": require('./rec-marketplace/list-recs'),
    "tmpGetListedRecs": require('./rec-marketplace/get-listed-recs'),
}