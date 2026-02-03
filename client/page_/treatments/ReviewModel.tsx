import React, { memo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReviewModalProps } from "@/types/review";
import { Star, MessageCircle, Award, Sparkles } from "lucide-react";

const ReviewModal = memo(
  ({
    isReviewModalOpen,
    setIsReviewModalOpen,
    reviewForm,
    setReviewForm,
    service,
    renderStars,
    handleReviewSubmit,
    isSubmittingReview,
    resetReviewForm,
  }: ReviewModalProps) => {
    interface RatingChangeHandler {
      (rating: number): void;
    }

    const handleRatingChange: RatingChangeHandler = useCallback(
      (rating: number) => {
        setReviewForm((prev: typeof reviewForm) => ({
          ...prev,
          review_ratings: rating,
        }));
      },
      [setReviewForm]
    );

    const handleMessageChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReviewForm((prev: typeof reviewForm) => ({
          ...prev,
          review_message: e.target.value,
        }));
      },
      [setReviewForm]
    );

    const handleCancel = useCallback(() => {
      setIsReviewModalOpen(false);
      resetReviewForm();
    }, [setIsReviewModalOpen, resetReviewForm]);

    const getRatingText = (rating: number) => {
      const ratingTexts = {
        1: { text: "Poor", color: "text-red-600", emoji: "😞" },
        2: { text: "Fair", color: "text-orange-600", emoji: "😐" },
        3: { text: "Good", color: "text-yellow-600", emoji: "🙂" },
        4: { text: "Very Good", color: "text-blue-600", emoji: "😊" },
        5: { text: "Excellent", color: "text-green-600", emoji: "🤩" },
      };
      return ratingTexts[rating as keyof typeof ratingTexts];
    };

    const isFormValid =
      reviewForm.review_message.trim() && reviewForm.review_ratings > 0;

    return (
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[620px] h-[90dvh] md:h-[95dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-0 shadow-2xl overflow-scroll md:overflow-hidden">
          {/* Header with gradient background */}
          <div className="absolute hidden md:block top-0 left-0 right-0 h-24 bg-[#1F6FFF] opacity-10"></div>

          <DialogHeader className="relative z-10 text-center pb-2 ">
            <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r text-dark-500">
              Share Your Experience
            </DialogTitle>

            <DialogDescription className="text-base text-gray-600  leading-relaxed">
              Help others by sharing your experience with{" "}
              <span className="font-semibold text-blue-700">
                {service?.service_name}
              </span>{" "}
              treatment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Rating Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-blue-600" />
                <Label
                  htmlFor="rating"
                  className="text-lg font-semibold text-gray-900"
                >
                  Rate Your Experience *
                </Label>
              </div>

              {/* Stars Container */}
              <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                    {renderStars(
                      reviewForm.review_ratings,
                      true,
                      handleRatingChange
                    )}
                  </div>

                  {reviewForm.review_ratings > 0 ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="text-2xl">
                        {getRatingText(reviewForm.review_ratings)?.emoji}
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          getRatingText(reviewForm.review_ratings)?.color
                        }`}
                      >
                        {getRatingText(reviewForm.review_ratings)?.text} (
                        {reviewForm.review_ratings}/5)
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      👆 Tap a star to rate your experience
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Review Message */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <Label
                  htmlFor="review"
                  className="text-lg font-semibold text-gray-900"
                >
                  Tell Us More *
                </Label>
              </div>

              <div className="relative">
                <Textarea
                  id="review"
                  placeholder="What made your experience special? Share details that could help others make their decision..."
                  value={reviewForm.review_message}
                  onChange={handleMessageChange}
                  className="min-h-[120px] bg-white border-2 border-blue-100 focus:border-blue-400 focus:ring-blue-200 rounded-lg text-base leading-relaxed resize-none transition-all duration-300"
                  maxLength={500}
                />

                {/* Character counter */}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    💡 The more details you share, the more helpful your review
                    becomes
                  </p>
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      reviewForm.review_message.length > 450
                        ? "bg-red-100 text-red-700"
                        : reviewForm.review_message.length > 350
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {reviewForm.review_message.length}/500
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-blue-100">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmittingReview}
              className="w-full sm:w-auto border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-all duration-300"
            >
              Cancel
            </Button>

            <Button
              onClick={handleReviewSubmit}
              disabled={isSubmittingReview || !isFormValid}
              className={`w-full sm:w-auto font-bold py-3 px-8 rounded-lg transition-all duration-300 transform ${
                isFormValid
                  ? "text-white bg-gradient-to-r from-[#155DFC] to-[#0092B8] border-2 border-[#155DFC] hover:scale-105 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isSubmittingReview ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-lg animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Submit Review
                </div>
              )}
            </Button>
          </DialogFooter>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-8 h-8 bg-blue-200 opacity-20 rounded-full blur-sm"></div>
          <div className="absolute bottom-8 left-4 w-6 h-6 bg-indigo-200 opacity-30 rounded-full blur-sm"></div>
          <div className="absolute top-1/2 right-8 w-4 h-4 bg-blue-300 opacity-25 rounded-full animate-pulse"></div>
        </DialogContent>
      </Dialog>
    );
  }
);

ReviewModal.displayName = "ReviewModal";

export default ReviewModal;
