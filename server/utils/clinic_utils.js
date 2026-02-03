exports.validateClinicData = (data) => {
    const errors = [];

    if (!data.clinic_name || typeof data.clinic_name !== 'string' || !data.clinic_name.trim()) {
        errors.push('Clinic name is required');
    } else if (data.clinic_name.trim().length > 100) {
        errors.push('Clinic name must not exceed 100 characters');
    }

    if (!data.clinic_contact_details) {
        errors.push('Clinic contact details are required');
    } else {
        if (!data.clinic_contact_details.email || typeof data.clinic_contact_details.email !== 'string') {
            errors.push('Email is required');
        } else if (!/^\S+@\S+\.\S+$/.test(data.clinic_contact_details.email.trim())) {
            errors.push('Please provide a valid email address');
        }

        if (!data.clinic_contact_details.phone_numbers || !Array.isArray(data.clinic_contact_details.phone_numbers) || data.clinic_contact_details.phone_numbers.length === 0) {
            errors.push('At least one phone number is required');
        } else {
            data.clinic_contact_details.phone_numbers.forEach((phone, index) => {
                if (!phone || typeof phone !== 'string' || !/^[0-9\-\+\s]{10,15}$/.test(phone.trim())) {
                    errors.push(`Invalid phone number format at position ${index + 1}`);
                }
            });
        }

        if (!data.clinic_contact_details.clinic_address || typeof data.clinic_contact_details.clinic_address !== 'string' || !data.clinic_contact_details.clinic_address.trim()) {
            errors.push('Clinic address is required');
        } else if (data.clinic_contact_details.clinic_address.trim().length > 300) {
            errors.push('Clinic address must not exceed 300 characters');
        }
    }

    if (!data.clinic_map || typeof data.clinic_map !== 'string' || !data.clinic_map.trim()) {
        errors.push('Clinic map location is required');
    }

    if (!data.clinic_timings) {
        errors.push('Clinic timings are required');
    } else {
        if (!data.clinic_timings.open_time || typeof data.clinic_timings.open_time !== 'string' || !data.clinic_timings.open_time.trim()) {
            errors.push('Opening time is required');
        }

        if (!data.clinic_timings.close_time || typeof data.clinic_timings.close_time !== 'string' || !data.clinic_timings.close_time.trim()) {
            errors.push('Closing time is required');
        }

        const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (!data.clinic_timings.off_day || !validDays.includes(data.clinic_timings.off_day)) {
            errors.push('Valid off day is required (Sunday to Saturday)');
        }
    }

    if (!data.BookingAvailabeAt) {
        errors.push('Booking availability dates are required');
    } else {
        if (!data.BookingAvailabeAt.start_date) {
            errors.push('Booking start date is required');
        } else if (isNaN(Date.parse(data.BookingAvailabeAt.start_date))) {
            errors.push('Invalid booking start date format');
        }

        if (!data.BookingAvailabeAt.end_date) {
            errors.push('Booking end date is required');
        } else if (isNaN(Date.parse(data.BookingAvailabeAt.end_date))) {
            errors.push('Invalid booking end date format');
        }
    }

    if (data.clinic_stauts && !['Booking Open', 'Booking Close', 'Draft', 'Published'].includes(data.clinic_stauts)) {
        errors.push('Invalid clinic status');
    }

    if (data.clinic_ratings !== undefined) {
        const rating = parseFloat(data.clinic_ratings);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            errors.push('Clinic rating must be between 0 and 5');
        }
    }


    return errors.length > 0 ? errors : null;
};









exports.validateClinicUpdateData = (data) => {
    const errors = [];

    if (data.clinic_name !== undefined) {
        if (!data.clinic_name || typeof data.clinic_name !== 'string' || !data.clinic_name.trim()) {
            errors.push('Clinic name cannot be empty');
        } else if (data.clinic_name.trim().length > 100) {
            errors.push('Clinic name must not exceed 100 characters');
        }
    }

    if (data.clinic_contact_details !== undefined) {
        if (data.clinic_contact_details.email !== undefined) {
            if (!data.clinic_contact_details.email || typeof data.clinic_contact_details.email !== 'string') {
                errors.push('Email cannot be empty');
            } else if (!/^\S+@\S+\.\S+$/.test(data.clinic_contact_details.email.trim())) {
                errors.push('Please provide a valid email address');
            }
        }

        if (data.clinic_contact_details.phone_numbers !== undefined) {
            if (!Array.isArray(data.clinic_contact_details.phone_numbers) || data.clinic_contact_details.phone_numbers.length === 0) {
                errors.push('At least one phone number is required');
            } else {
                data.clinic_contact_details.phone_numbers.forEach((phone, index) => {
                    if (!phone || typeof phone !== 'string' || !/^[0-9\-\+\s]{10,15}$/.test(phone.trim())) {
                        errors.push(`Invalid phone number format at position ${index + 1}`);
                    }
                });
            }
        }

        if (data.clinic_contact_details.clinic_address !== undefined) {
            if (!data.clinic_contact_details.clinic_address || typeof data.clinic_contact_details.clinic_address !== 'string' || !data.clinic_contact_details.clinic_address.trim()) {
                errors.push('Clinic address cannot be empty');
            } else if (data.clinic_contact_details.clinic_address.trim().length > 300) {
                errors.push('Clinic address must not exceed 300 characters');
            }
        }
    }

    if (data.clinic_map !== undefined) {
        if (!data.clinic_map || typeof data.clinic_map !== 'string' || !data.clinic_map.trim()) {
            errors.push('Clinic map location cannot be empty');
        }
    }

    if (data.clinic_timings !== undefined) {
        if (data.clinic_timings.open_time !== undefined) {
            if (!data.clinic_timings.open_time || typeof data.clinic_timings.open_time !== 'string' || !data.clinic_timings.open_time.trim()) {
                errors.push('Opening time cannot be empty');
            }
        }

        if (data.clinic_timings.close_time !== undefined) {
            if (!data.clinic_timings.close_time || typeof data.clinic_timings.close_time !== 'string' || !data.clinic_timings.close_time.trim()) {
                errors.push('Closing time cannot be empty');
            }
        }

        if (data.clinic_timings.off_day !== undefined) {
            const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            if (!validDays.includes(data.clinic_timings.off_day)) {
                errors.push('Valid off day is required (Sunday to Saturday)');
            }
        }
    }

    if (data.BookingAvailabeAt !== undefined) {
        if (data.BookingAvailabeAt.start_date !== undefined) {
            if (!data.BookingAvailabeAt.start_date || isNaN(Date.parse(data.BookingAvailabeAt.start_date))) {
                errors.push('Invalid booking start date format');
            }
        }

        if (data.BookingAvailabeAt.end_date !== undefined) {
            if (!data.BookingAvailabeAt.end_date || isNaN(Date.parse(data.BookingAvailabeAt.end_date))) {
                errors.push('Invalid booking end date format');
            }
        }
    }

    if (data.clinic_stauts !== undefined && !['Booking Open', 'Booking Close', 'Draft', 'Published'].includes(data.clinic_stauts)) {
        errors.push('Invalid clinic status');
    }

    if (data.clinic_ratings !== undefined) {
        const rating = parseFloat(data.clinic_ratings);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            errors.push('Clinic rating must be between 0 and 5');
        }
    }

    if (data.any_special_note !== undefined && typeof data.any_special_note === 'string' && data.any_special_note.trim().length > 300) {
        errors.push('Special note must not exceed 300 characters');
    }

    return errors.length > 0 ? errors : null;
};

exports.validateBusinessRules = (data, existingClinic = null) => {
    const errors = [];

    if (data.BookingAvailabeAt) {
        const startDate = new Date(data.BookingAvailabeAt.start_date);
        const endDate = new Date(data.BookingAvailabeAt.end_date);
        const currentDate = new Date();

        if (startDate < currentDate) {
            errors.push('Booking start date cannot be in the past');
        }

        if (endDate <= startDate) {
            errors.push('Booking end date must be after start date');
        }

        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        if (daysDiff < 1) {
            errors.push('Booking period must be at least 1 day');
        }

        if (daysDiff > 365) {
            errors.push('Booking period cannot exceed 365 days');
        }
    }

    if (data.clinic_timings && data.clinic_timings.open_time && data.clinic_timings.close_time) {
        const openTime = parseTime(data.clinic_timings.open_time);
        const closeTime = parseTime(data.clinic_timings.close_time);

        if (openTime && closeTime) {
            if (closeTime <= openTime) {
                errors.push('Closing time must be after opening time');
            }
        } else {
            errors.push('Invalid time format. Use HH:MM format (e.g., 09:00, 17:30)');
        }
    }

    if (data.clinic_stauts === 'Booking Open' && data.BookingAvailabeAt) {
        const startDate = new Date(data.BookingAvailabeAt.start_date);
        const endDate = new Date(data.BookingAvailabeAt.end_date);
        const currentDate = new Date();

        if (currentDate < startDate || currentDate > endDate) {
            errors.push('Cannot set status to "Booking Open" when current date is outside booking availability period');
        }
    }

    if (existingClinic && existingClinic.clinic_stauts === 'Published' && data.clinic_stauts === 'Draft') {
        errors.push('Cannot change status from Published back to Draft');
    }

    if (data.clinic_contact_details && data.clinic_contact_details.phone_numbers) {
        const uniquePhones = [...new Set(data.clinic_contact_details.phone_numbers.map(phone => phone.trim()))];
        if (uniquePhones.length !== data.clinic_contact_details.phone_numbers.length) {
            errors.push('Duplicate phone numbers are not allowed');
        }
    }

    return errors.length > 0 ? errors : null;
};


const parseTime = (timeString) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const match = timeString.match(timeRegex);

    if (!match) {
        return null;
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    return hours * 60 + minutes;
};
