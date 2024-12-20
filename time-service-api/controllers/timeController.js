const TimeSpent = require('../models/TimeSpent');
const User = require('../models/User'); // Assuming you have the User model

// Helper function to convert seconds into a readable format (hours and minutes)
const convertTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let formattedTime = '';
  if (hours > 0) {
    formattedTime += `${hours}h `;
  }
  if (remainingMinutes > 0) {
    formattedTime += `${remainingMinutes}m `;
  }
  if (remainingSeconds > 0) {
    formattedTime += `${remainingSeconds}s`;
  }
  return formattedTime.trim();
};

// Helper function to check if user exists
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// Controller to get the time spent reading a specific book for a specific user in a specific course
const getTimeSpentByUserAndBook = async (req, res) => {
  const { userId, bookId, courseId } = req.params;

  try {
    // Ensure the user exists
    await getUserById(userId);

    // Find the time spent by the user for a specific book and course
    const userTime = await TimeSpent.findOne({ userId, bookId, courseId });

    if (userTime) {
      const formattedTime = convertTime(userTime.timeSpent); 
      return res.json({ 
        courseId: userTime.courseId,  // Include courseId in response
        timeSpent: formattedTime 
      });
    }

    // If no record is found, return default timeSpent and courseId
    res.json({ 
      courseId, 
      timeSpent: '0m 0s' 
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Controller to save the time spent reading a specific book for a specific user in a specific course
const saveTimeSpent = async (req, res) => {
  const { userId, bookId, courseId } = req.params;
  let { timeSpent } = req.body; // Expecting time in seconds

  // Validate timeSpent
  if (typeof timeSpent !== 'number' || timeSpent < 0) {
    return res.status(400).json({ message: 'Invalid time format. Time spent should be a positive number in seconds.' });
  }

  // Adjust the timer speed as needed
  timeSpent = Math.floor(timeSpent / 2);  // Adjust this factor as necessary

  try {
    // Ensure the user exists
    await getUserById(userId);

    // Check if a time record already exists for the user, book, and course
    let userTime = await TimeSpent.findOne({ userId, bookId, courseId });

    if (userTime) {
      userTime.timeSpent += timeSpent; // Add new time to the existing time
    } else {
      userTime = new TimeSpent({ userId, bookId, courseId, timeSpent });
    }

    // Save or update the timeSpent record
    await userTime.save();
    
    const formattedTime = convertTime(userTime.timeSpent); // Convert to a readable format
    res.json({ 
      message: 'Time spent updated', 
      timeSpent: formattedTime 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving time spent', error });
  }
};

// Controller to get all time spent data for all users, books, and courses
const getAllTimeSpent = async (req, res) => {
  try {
    const allTimeSpent = await TimeSpent.find();
    // Convert each user's timeSpent from seconds to a readable format
    const formattedTimeSpent = allTimeSpent.map(user => ({
      ...user._doc,
      timeSpent: convertTime(user.timeSpent),
      courseId: user.courseId  // Include courseId in response
    }));
    res.json(formattedTimeSpent);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving all time spent data', error });
  }
};

// Controller to get the total time spent by a specific user across all books and courses
const getTotalTimeSpentByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure the user exists
    await getUserById(userId);

    // Aggregate time spent across all books and courses for the user
    const totalTimeSpent = await TimeSpent.aggregate([
      { $match: { userId } },  // Match the user's time entries
      { $group: { _id: null, totalTime: { $sum: "$timeSpent" } } }  // Sum the timeSpent for the user
    ]);

    // If no time data exists for the user, return 0
    const totalSeconds = totalTimeSpent.length > 0 ? totalTimeSpent[0].totalTime : 0;
    
    const formattedTime = convertTime(totalSeconds);  // Convert total time from seconds to a readable format
    res.json({ totalTimeSpent: formattedTime });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving total time spent by user', error: error.message });
  }
};

// Controller to delete all time spent by a specific user across all books and courses
const deleteUserTimeSpent = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure the user exists
    await getUserById(userId);

    // Delete all time entries for the user
    const result = await TimeSpent.deleteMany({ userId });

    // Return a success message with the count of deleted entries
    res.json({
      message: `Successfully deleted ${result.deletedCount} time entries for user ${userId}.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting time spent by user', error: error.message });
  }
};





module.exports = {
  getTimeSpentByUserAndBook,
  saveTimeSpent,
  getAllTimeSpent,
  getTotalTimeSpentByUser,
  deleteUserTimeSpent , // New function  
};
