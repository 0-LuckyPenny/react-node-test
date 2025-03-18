const MeetingHistory = require('../../model/schema/meeting');
const User = require('../../model/schema/user');
const mongoose = require('mongoose');

// Add a new meeting
const add = async (req, res) => {
    try {
        const meetingData = { ...req.body, createdDate: new Date() };
        const newMeeting = new MeetingHistory(meetingData);
        await newMeeting.save();
        res.status(200).json(newMeeting);
    } catch (err) {
        console.error('Failed to create Meeting:', err);
        res.status(400).json({ error: 'Failed to create Meeting' });
    }
};

// Get list of meetings
const index = async (req, res) => {
    const query = { ...req.query, deleted: false };
    
    try {
        const meetings = await MeetingHistory.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'createByInfo'
                }
            },
            { $unwind: { path: '$createByInfo', preserveNullAndEmptyArrays: true } },
            { $match: { 'createByInfo.deleted': false } },
            {
                $project: {
                    _id: 1,
                    agenda: 1,
                    attendes: 1,
                    attendesLead: 1,
                    createdByName: { $concat: ['$createByInfo.firstName', ' ', '$createByInfo.lastName'] },
                    dateTime: 1,
                    deleted: 1,
                    location: 1,
                    notes: 1,
                    related: 1,
                    timestamp: 1
                }
            }
        ]);

        res.json(meetings.filter(meeting => meeting.createBy !== null));
    } catch (err) {
        console.error('Error fetching meetings:', err);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
};

// View a specific meeting
const view = async (req, res) => {
    let meeting = await MeetingHistory.findOne({ _id: req.params.id });
    if (!meeting) return res.status(404).json({ message: 'No meeting found.' });
    try {
        let response = await MeetingHistory.aggregate([
            {
                $match: { _id: meeting._id } 
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'createByInfo'
                }
            },
            {
                $unwind: {
                    path: '$createByInfo',
                    preserveNullAndEmptyArrays: true  
                }
            },
            {
                $project: {  
                    _id: 1,
                    agenda: 1,
                    attendes: 1,
                    attendesLead: 1,
                    createdByName: { $concat: ['$createByInfo.firstName', ' ', '$createByInfo.lastName'] } ,  // Return 'username' from 'createByInfo'
                    dateTime: 1,
                    deleted: 1,
                    location: 1,
                    notes: 1,
                    related: 1,
                    timestamp: 1
                }
            }
        ]);
        if (response.length === 0) return res.status(404).json({ message: 'Meeting not found.' });
        res.json(response[0]); // Return the first (and only) result
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ error: 'Failed to retrieve data' });
    }
};

// Soft delete a meeting
const deleteData = async (req, res) => {
    try {
        const updatedMeeting = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
        if (!updatedMeeting) return res.status(404).json({ message: 'Meeting not found' });
        res.status(200).json({ message: 'Meeting deleted successfully', updatedMeeting });
    } catch (err) {
        res.status(404).json({ message: 'Error deleting meeting', error: err });
    }
};

// Soft delete multiple meetings
const deleteMany = async (req, res) => {
    try {
        const updatedMeetings = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });
        res.status(200).json({ message: 'Meetings deleted successfully', updatedMeetings });
    } catch (err) {
        res.status(404).json({ message: 'Error deleting meetings', error: err });
    }
};

module.exports = { add, index, view, deleteData, deleteMany };
