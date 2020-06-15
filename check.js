// let now = new Date(),
//     date = now.getDate(),
//     month = now.getMonth()+1,
//     year = now.getFullYear()

//     console.log(date);
//     console.log(month);
//     console.log(year);


let now = new Date(new Date().toDateString())
now = now.toISOString().split('T')[0]
console.log(now);
