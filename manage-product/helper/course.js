module.exports.priceNewCourses = (courses) => {
    const newCourses = courses.map(item => {
      item.priceNew = ((item.price * (100 - item.discountPercentage)) / 100).toFixed(0);
  
      return item;
    });
  
    return newCourses;
  }


module.exports.priceNewCourse = (course) => {
  const newPrice =  ((course.price * (100 - course.discountPercentage)) / 100).toFixed(0);
  return newPrice;
} 