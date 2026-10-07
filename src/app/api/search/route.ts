import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SearchService, SearchFilters } from '@/lib/services/search-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || undefined;
    const subcategoryId = searchParams.get('subcategory') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const maxDistanceKm = searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined;
    const userLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined;
    const userLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined;
    const availableNowOnly = searchParams.get('available') === 'true';
    const sortBy = (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'relevance';

    const dietaryParam = searchParams.get('dietary');
    const dietary = dietaryParam ? (dietaryParam.split(',') as SearchFilters['dietary']) : undefined;

    const nutritionParam = searchParams.get('nutrition');
    const nutrition = nutritionParam ? (nutritionParam.split(',') as SearchFilters['nutrition']) : undefined;

    const tagIdsParam = searchParams.get('tags');
    const tagIds = tagIdsParam ? tagIdsParam.split(',') : undefined;

    const filters: SearchFilters = {
      query,
      categoryId,
      subcategoryId,
      tagIds,
      minPrice,
      maxPrice,
      minRating,
      maxDistanceKm,
      userLat,
      userLng,
      dietary,
      nutrition,
      availableNowOnly,
      sortBy,
    };

    await db.sync();
    const products = db.getProducts();
    const cookers = db.getCookers();
    const categories = db.getCategories();
    const tags = db.getTags();
    const settings = db.getSettings();

    const rankedResults = SearchService.searchAndRank(
      products,
      cookers,
      categories,
      tags,
      filters,
      settings
    );

    return NextResponse.json({
      success: true,
      count: rankedResults.length,
      results: rankedResults,
      appliedFilters: filters,
    });
  } catch (error) {
    console.error('Error in search route:', error);
    return NextResponse.json({ success: false, message: 'Search execution failed.' }, { status: 500 });
  }
}
