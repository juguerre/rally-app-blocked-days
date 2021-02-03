var date_diff_indays = function (date1, date2) {
    dt1 = new Date(date1);
    dt2 = new Date(date2);
    if (dt1.getFullYear() == 9999){
        dt1 = new Date()        
    }
    if (dt2.getFullYear() == 9999) {
        dt2 = new Date()
    }
    //return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), 
    //               dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
    return Math.floor( (dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
}

var group_by_fid_sum_deltas = function (records) {
    let r_plus = {}
    for (record of records) {
        // Init record for every formatedID
        if (r_plus[record.FormattedID] == null) {
            r_plus[record.FormattedID] = {
                FormattedID: record.FormattedID,
                ObjectID: record.ObjectID,
                Name: record.Name,
                DaysBlocked: 0
            }
        }
        
        r_plus[record.FormattedID].DaysBlocked = r_plus[record.FormattedID].DaysBlocked + 
                                                date_diff_indays(record._ValidFrom, record._ValidTo)
    }
    return r_plus
}


records = [
    {
        _ValidFrom: "2021-01-14T09:34:31.921Z",
        _ValidTo: "2021-01-20T09:30:51.912Z",
        Name: "My US sample",
        ObjectID: 66884138793,
        FormattedID: "US137995"
    },
    {
        _ValidFrom: "2021-01-12T09:22:09.641Z",
        _ValidTo: "2021-01-14T09:34:31.921Z",
        Name: "My US sample",
        ObjectID: 66884138793,
        FormattedID: "US137995"
    },
    {
        _ValidFrom: "2021-01-14T09:27:00.986Z",
        _ValidTo: "9999-01-01T00:00:00.000Z",
        Name: "My US sample2",
        ObjectID: 66884209509,
        FormattedID: "US138144"
    },
    {
        _ValidFrom: "2021-01-14T09:27:00.982Z",
        _ValidTo: "9999-01-01T00:00:00.000Z",
        Name: "My US sample3",
        ObjectID: 66884213809,
        FormattedID: "US138153"
    }
]

r_plus = group_by_fid_sum_deltas(records)


console.log(r_plus)
console.log(Object.values(r_plus))