
interface ServiceImage {
    url: string
    public_id: string
    _id: string
}

interface Doctor {
    _id: string
    doctor_name: string
    doctor_images: string[]
    specialization: string[]
    languagesSpoken: string[]
    doctor_status: string
    doctor_ratings: number
    any_special_note: string
    clinic_ids: string[]
}

interface Review {
    _id: string
    reviewer_id: string
    review_message: string
    review_ratings: number
    review_for_what_service: string
    review_status: string
    createdAt: string
    updatedAt: string
}

export interface ServiceData {
    _id: string
    service_name: string
    service_small_desc: string
    service_desc: string
    service_images: ServiceImage[]
    service_status: string
    service_session_allowed_limit: number
    service_per_session_price: number
    service_per_session_discount_price: number
    service_per_session_discount_percentage: number
    service_tag: string
    service_doctor: Doctor
    service_reviews: Review[]
    position: number
    createdAt: string
    updatedAt: string
}
