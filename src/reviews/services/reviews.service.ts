import { ReviewDto } from './../dto/review.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ReviewsRepository } from '../reviews.repository';
import { ReviewRequestDto } from '../dto/review.request.dto';
import { ProductsRepository } from 'src/products/products.repository';
import { ReviewQueryDto } from '../dto/reviewByProduct.request.dto';
import { Types } from 'mongoose';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async createReview(reviewDto: ReviewDto) {
    const { product } = reviewDto;

    const isProductExist = await this.productsRepository.existsById(product);

    if (!isProductExist)
      throw new BadRequestException('PRODUCT_DOES_NOT_EXIST');

    const review = await this.reviewsRepository.createReview(reviewDto);

    await this.reviewsRepository.addRecentReview(review);

    const recentReviewCount = await this.reviewsRepository.countRecentReview(
      product,
    );

    if (recentReviewCount > 5) {
      await this.reviewsRepository.removeRecentReview(product);
    }
    return review;
  }

  async updateReview(reviewId: string, userId: string, body: ReviewRequestDto) {
    const isReviewExist = await this.reviewsRepository.existsReview(
      reviewId,
      userId,
    );

    if (!isReviewExist) throw new BadRequestException('REVIEW_DOES_NOT_EXIST');

    const updateReview = await this.reviewsRepository.updateReview(
      reviewId,
      body,
    );

    await this.reviewsRepository.updateRecentReview(updateReview);

    return updateReview;
  }

  async deleteReview(reviewId: string, userId: string) {
    const isReviewExist = await this.reviewsRepository.existsReview(
      reviewId,
      userId,
    );

    if (!isReviewExist) throw new BadRequestException('REVIEW_DOES_NOT_EXIST');

    await this.reviewsRepository.deleteRecentReview(reviewId);
    const deleteReview = await this.reviewsRepository.deleteReview(reviewId);

    return deleteReview;
  }

  async getReviewByProduct(productId: string, query: ReviewQueryDto) {
    const isProductExist = await this.productsRepository.existsById(productId);

    if (!isProductExist)
      throw new BadRequestException('PRODUCT_DOES_NOT_EXIST');

    return await this.reviewsRepository.findReviewByProduct(productId, query);
  }

  async getReviewByAuthor(
    userId: string | Types.ObjectId,
    query: ReviewQueryDto,
  ) {
    return await this.reviewsRepository.findReviewByAuthor(userId, query);
  }
}
