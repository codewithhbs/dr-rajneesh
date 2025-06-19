import { ServiceData } from "./service";

export interface ReviewFormData {
    review_message: string
    review_ratings: number
    review_for_what_service: string
}
export interface ReviewModalProps {
    isReviewModalOpen: boolean;
    setIsReviewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    reviewForm: ReviewFormData;
    setReviewForm: React.Dispatch<React.SetStateAction<ReviewFormData>>;
    service: ServiceData;
    renderStars: (rating: number, interactive?: boolean, onStarClick?: (rating: number) => void) => React.ReactNode;
    handleReviewSubmit: () => void;
    isSubmittingReview: boolean;
    resetReviewForm: () => void;
}