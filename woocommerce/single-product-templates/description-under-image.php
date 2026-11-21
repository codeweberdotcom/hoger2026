<?php
/**
 * WooCommerce Single Product Page - template "Description under the image".
 *
 * Copy of woocommerce/single-product.php with one change: the short description
 * (excerpt) is not shown under the title in the right column, but in the left
 * column under the gallery, in a "card card-body bg-transparent border border-primary text-white" block.
 *
 * Chosen per product in the "Product template" box (meta _cw_product_template),
 * see functions/woocommerce/product-template.php.
 * When the default layout (single-product.php) changes, apply the same change here.
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();

	global $product;

	if ( ! $product instanceof WC_Product ) {
		continue;
	}

	do_action( 'woocommerce_before_single_product' );

	// ── Page Header (хлебные крошки + фон — управляется через Redux) ─────────
	get_pageheader();

	// ── ЭТАПЫ 2 + 6: Блок товара (галерея + данные) ──────────────────────────

	// Стиль скругления карточек из Redux
	$card_radius = class_exists( 'Codeweber_Options' ) ? Codeweber_Options::style( 'card-radius' ) : 'rounded';

	// Данные галереи
	$main_image_id = $product->get_image_id();
	$gallery_ids   = $product->get_gallery_image_ids();
	$all_image_ids = array_merge(
		$main_image_id ? [ $main_image_id ] : [],
		$gallery_ids
	);
	$has_gallery = count( $all_image_ids ) > 1;

	// Настройки слайдера галереи из Redux
	$thumbs_dir        = class_exists( 'Codeweber_Options' ) ? ( Codeweber_Options::get( 'woo_gallery_thumbs_direction' ) ?: 'horizontal' ) : 'horizontal';
	$thumbs_items      = class_exists( 'Codeweber_Options' ) ? ( Codeweber_Options::get( 'woo_gallery_thumbs_items' ) ?: 5 ) : 5;
	$thumbs_mousewheel = class_exists( 'Codeweber_Options' ) && Codeweber_Options::get( 'woo_gallery_thumbs_mousewheel' );
	$hover_style       = class_exists( 'Codeweber_Options' ) ? ( Codeweber_Options::get( 'woo_gallery_hover_style' ) ?: 'style-4' ) : 'style-4';
	$hover_type        = class_exists( 'Codeweber_Options' ) ? ( Codeweber_Options::get( 'woo_gallery_hover_type' ) ?: '' ) : '';
	$thumb_hover       = class_exists( 'Codeweber_Options' ) ? ( Codeweber_Options::get( 'woo_gallery_thumb_hover' ) ?: 'none' ) : 'none';

	// Ширина колонок
	$cols_raw    = class_exists( 'Codeweber_Options' ) ? ( Codeweber_Options::get( 'woo_single_cols' ) ?: '6/6' ) : '6/6';
	$cols        = explode( '/', $cols_raw );
	$col_gallery = 'col-lg-' . ( isset( $cols[0] ) ? (int) $cols[0] : 6 );
	$col_summary = 'col-lg-' . ( isset( $cols[1] ) ? (int) $cols[1] : 6 );

	// Видимость элементов
	$show_title   = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_show_single_title', true );
	$show_price   = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_price', true );
	$show_rating  = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_rating', true );
	$show_excerpt = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_excerpt', true );
	$show_meta    = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_meta', true );
	$show_tabs    = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_tabs', true );
	$show_related = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_related', true );
	$show_reviews = ! class_exists( 'Codeweber_Options' ) || Codeweber_Options::get( 'woo_single_show_reviews', true );

	// Видео товара
	$video_url       = get_post_meta( $product->get_id(), '_cw_product_video_url', true );
	$video_type      = get_post_meta( $product->get_id(), '_cw_product_video_type', true ) ?: '';
	$video_data      = $video_url && function_exists( 'cw_product_video_parse' ) ? cw_product_video_parse( $video_url, $video_type ) : null;
	$video_poster_id = (int) get_post_meta( $product->get_id(), '_cw_product_video_poster_id', true );
	$v_thumb_full    = ( $video_data && $video_poster_id ) ? wp_get_attachment_image_url( $video_poster_id, 'cw_square_lg' ) : '';
	$v_thumb_sm      = ( $video_data && $video_poster_id ) ? wp_get_attachment_image_url( $video_poster_id, 'thumbnail' ) : '';
	?>

	<section class="wrapper">
		<div class="container py-14 py-md-16">
			<div class="row gx-md-8 gx-xl-12 gy-8">

				<?php // ── ЭТАП 6: Галерея (левая колонка) ──────────────────── ?>
				<div class="<?php echo esc_attr( $col_gallery ); ?> cw-product-gallery">

					<?php if ( $has_gallery ) : ?>

					<?php // ── Скрытый iframe для VK / Rutube (используется GLightbox) ── ?>
					<?php if ( $video_data && ! empty( $video_data['embed_id'] ) ) : ?>
					<div id="<?php echo esc_attr( $video_data['embed_id'] ); ?>" class="d-none" style="width:100%;height:100%;">
						<iframe src="<?php echo esc_url( $video_data['embed_url'] ); ?>"
						        style="width:100%;height:100%;border:0;"
						        allowfullscreen
						        allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write;"></iframe>
					</div>
					<?php endif; ?>

					<div class="swiper-container swiper-thumbs-container" data-margin="10" data-dots="false" data-nav="true" data-thumbs="true" data-thumbs-direction="<?php echo esc_attr( $thumbs_dir ); ?>" data-thumbs-items="<?php echo esc_attr( $thumbs_items ); ?>"<?php echo $thumbs_mousewheel ? ' data-thumbs-mousewheel="true"' : ''; ?>>

						<?php // ── Скелетон галереи (виден до инициализации Swiper) ── ?>
						<div class="cw-gallery-skeleton<?php echo $thumbs_dir === 'vertical' ? ' cw-gallery-skeleton--v' : ''; ?>">
							<div class="cw-skeleton-block cw-gallery-skeleton__main"></div>
							<div class="cw-gallery-skeleton__thumbs">
								<?php for ( $i = 0; $i < (int) $thumbs_items; $i++ ) : ?>
								<div class="cw-skeleton-block cw-gallery-skeleton__thumb"></div>
								<?php endfor; ?>
							</div>
						</div>

						<div class="swiper">
							<div class="swiper-wrapper">
								<?php foreach ( $all_image_ids as $img_id ) :
									$full_url = wp_get_attachment_image_url( $img_id, 'cw_wide_4x3_xl' ) ?: wp_get_attachment_image_url( $img_id, 'full' );
								?>
								<div class="swiper-slide">
									<?php
									$pid       = esc_attr( $product->get_id() );
									$r         = esc_attr( $card_radius );
									$img_tag   = wp_get_attachment_image( $img_id, 'cw_square_lg', false, [ 'class' => 'img-fluid' ] );
									$lb_attrs  = $full_url ? sprintf( ' href="%s" data-glightbox data-gallery="product-%s"', esc_url( $full_url ), $pid ) : ' href="#"';
									$svg_plus  = '<svg fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M220,128a4.0002,4.0002,0,0,1-4,4H132v84a4,4,0,0,1-8,0V132H40a4,4,0,0,1,0-8h84V40a4,4,0,0,1,8,0v84h84A4.0002,4.0002,0,0,1,220,128Z"></path></svg>';
									$ht        = $hover_type ? ' ' . esc_attr( $hover_type ) : '';
									?>
									<?php if ( 'none' === $hover_style ) : ?>
									<figure class="overflow-hidden <?php echo $r . $ht; ?>">
										<?php echo $img_tag; ?>
									</figure>

									<?php elseif ( 'style-1' === $hover_style ) : ?>
									<figure class="overflow-hidden overlay overlay-4 hover-plus <?php echo $r . $ht; ?>">
										<a<?php echo $lb_attrs; ?>>
											<?php echo $img_tag; ?>
											<span class="hover-icon text-white"><i class="uil uil-plus"></i></span>
										</a>
									</figure>

									<?php elseif ( 'style-2' === $hover_style ) : ?>
									<figure class="overflow-hidden overlay overlay-4 hover-plus <?php echo $r . $ht; ?>">
										<a<?php echo $lb_attrs; ?>>
											<?php echo $img_tag; ?>
											<span class="hover-icon text-white"><?php echo $svg_plus; ?></span>
										</a>
									</figure>

									<?php elseif ( 'style-3' === $hover_style ) : ?>
									<figure class="overflow-hidden hover-overlay <?php echo $r . $ht; ?>">
										<a<?php echo $lb_attrs; ?>>
											<?php echo $img_tag; ?>
											<span class="hover-icon bg-pale-frost text-white"><?php echo $svg_plus; ?></span>
										</a>
									</figure>

									<?php else : // style-4 (default) — item-link ?>
									<figure class="overflow-hidden <?php echo $r . $ht; ?>">
										<?php echo $img_tag; ?>
										<?php if ( $full_url ) : ?>
										<a class="item-link"
										   href="<?php echo esc_url( $full_url ); ?>"
										   data-glightbox
										   data-gallery="product-<?php echo $pid; ?>">
											<i class="uil uil-focus-add"></i>
										</a>
										<?php endif; ?>
									</figure>
									<?php endif; ?>
								</div>
								<?php endforeach; ?>

								<?php // ── Видео-слайд в main swiper ── ?>
								<?php if ( $video_data ) : ?>
								<div class="swiper-slide">
									<figure class="overflow-hidden <?php echo esc_attr( $card_radius ); ?> position-relative<?php echo $v_thumb_full ? '' : ' bg-primary'; ?>">
										<?php if ( $v_thumb_full ) : ?>
										<img src="<?php echo esc_url( $v_thumb_full ); ?>" class="img-fluid" style="height:100%;width:100%;object-fit:cover;" alt="">
										<?php endif; ?>
										<a href="<?php echo esc_url( $video_data['glightbox_href'] ); ?>"
										   class="position-absolute top-50 start-50 translate-middle"
										   <?php echo $video_data['glightbox_attrs']; ?>>
											<span class="btn btn-circle btn-soft-primary btn-play ripple"><i class="icn-caret-right"></i></span>
										</a>
									</figure>
								</div>
								<?php endif; ?>

							</div>
							<!-- /.swiper-wrapper -->
						</div>
						<!-- /.swiper (main) -->

						<?php // ── Thumbs swiper ────────────────────────────────── ?>
						<div class="swiper swiper-thumbs">
							<div class="swiper-wrapper">
								<?php foreach ( $all_image_ids as $img_id ) : ?>
								<div class="swiper-slide">
									<?php if ( 'none' === $thumb_hover ) : ?>
									<?php echo wp_get_attachment_image( $img_id, 'thumbnail', false, [ 'class' => esc_attr( $card_radius ) ] ); ?>
									<?php else : ?>
									<figure class="overflow-hidden <?php echo esc_attr( $thumb_hover . ' ' . $card_radius ); ?>">
										<?php echo wp_get_attachment_image( $img_id, 'thumbnail', false, [ 'class' => 'img-fluid' ] ); ?>
									</figure>
									<?php endif; ?>
								</div>
								<?php endforeach; ?>

								<?php // ── Видео-слайд в thumbs ── ?>
								<?php if ( $video_data ) : ?>
								<div class="swiper-slide">
									<div class="position-relative overflow-hidden h-100 <?php echo esc_attr( $card_radius ); ?><?php echo $v_thumb_sm ? '' : ' bg-primary'; ?>">
										<?php if ( $v_thumb_sm ) : ?>
										<img src="<?php echo esc_url( $v_thumb_sm ); ?>" class="<?php echo esc_attr( $card_radius ); ?>" style="width:100%;height:100%;object-fit:cover;display:block;" alt="">
										<?php endif; ?>
										<span class="position-absolute top-50 start-50 translate-middle text-white">
											<i class="icn-caret-right fs-40"></i>
										</span>
									</div>
								</div>
								<?php endif; ?>

							</div>
							<!-- /.swiper-wrapper -->
						</div>
						<!-- /.swiper (thumbs) -->
					</div>
					<!-- /.swiper-container -->

					<?php elseif ( $main_image_id ) :
						$full_url  = wp_get_attachment_image_url( $main_image_id, 'cw_wide_4x3_xl' ) ?: wp_get_attachment_image_url( $main_image_id, 'full' );
						$pid       = esc_attr( $product->get_id() );
						$r         = esc_attr( $card_radius );
						$img_tag   = wp_get_attachment_image( $main_image_id, 'cw_square_lg', false, [ 'class' => 'img-fluid' ] );
						$lb_attrs  = $full_url ? sprintf( ' href="%s" data-glightbox data-gallery="product-%s"', esc_url( $full_url ), $pid ) : ' href="#"';
						$svg_plus  = '<svg fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M220,128a4.0002,4.0002,0,0,1-4,4H132v84a4,4,0,0,1-8,0V132H40a4,4,0,0,1,0-8h84V40a4,4,0,0,1,8,0v84h84A4.0002,4.0002,0,0,1,220,128Z"></path></svg>';
					?>

					<?php if ( 'none' === $hover_style ) : ?>
					<figure class="<?php echo $r; ?>">
						<?php echo $img_tag; ?>
					</figure>

					<?php elseif ( 'style-1' === $hover_style ) : ?>
					<figure class="overlay overlay-4 hover-scale hover-plus <?php echo $r; ?>">
						<a<?php echo $lb_attrs; ?>>
							<?php echo $img_tag; ?>
							<span class="hover-icon text-white"><i class="uil uil-plus"></i></span>
						</a>
					</figure>

					<?php elseif ( 'style-2' === $hover_style ) : ?>
					<figure class="overlay overlay-4 hover-scale hover-plus <?php echo $r; ?>">
						<a<?php echo $lb_attrs; ?>>
							<?php echo $img_tag; ?>
							<span class="hover-icon text-white"><?php echo $svg_plus; ?></span>
						</a>
					</figure>

					<?php elseif ( 'style-3' === $hover_style ) : ?>
					<figure class="hover-scale hover-overlay <?php echo $r; ?>">
						<a<?php echo $lb_attrs; ?>>
							<?php echo $img_tag; ?>
							<span class="hover-icon bg-pale-frost text-white"><?php echo $svg_plus; ?></span>
						</a>
					</figure>

					<?php else : // style-4 (default) — item-link ?>
					<figure class="<?php echo $r; ?>">
						<?php echo $img_tag; ?>
						<?php if ( $full_url ) : ?>
						<a class="item-link"
						   href="<?php echo esc_url( $full_url ); ?>"
						   data-glightbox
						   data-gallery="product-<?php echo $pid; ?>">
							<i class="uil uil-focus-add"></i>
						</a>
						<?php endif; ?>
					</figure>
					<?php endif; ?>

					<?php else : ?>

					<figure class="<?php echo esc_attr( $card_radius ); ?>">
						<?php echo wc_placeholder_img( 'woocommerce_single' ); ?>
					</figure>

					<?php endif; ?>


					<?php // Short description under the gallery (was under the title in the right column). ?>
					<?php if ( $show_excerpt && '' !== trim( (string) $product->get_short_description() ) ) : ?>
					<div class="card card-body bg-transparent border border-primary text-white mt-5">
						<?php // Printed here (not via woocommerce_template_single_excerpt) to drop its mb-6; mb-n4 cancels the last paragraph margin. ?>
						<div class="woocommerce-product-details__short-description mb-n4">
							<?php echo apply_filters( 'woocommerce_short_description', $product->get_short_description() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</div>
					</div>
					<?php endif; ?>

				</div>
				<!-- /col gallery -->

				<?php // ── ЭТАП 2: Данные товара (правая колонка) ────────────── ?>
				<div class="<?php echo esc_attr( $col_summary ); ?>">

					<div class="post-header mb-5">
						<?php // universal_title(): the "Alternative Title (HTML)" field (_alt_title) overrides the product name when set. ?>
						<?php if ( $show_title ) : echo universal_title( 'h1', 'post-title display-5' ); endif; ?>
						<?php if ( $show_price ) : woocommerce_template_single_price(); endif; ?>
						<?php if ( $show_rating ) : woocommerce_template_single_rating(); endif; ?>
					</div>
					<!-- /.post-header -->

					<?php woocommerce_template_single_add_to_cart(); ?>

					<?php if ( $show_meta ) : woocommerce_template_single_meta(); endif; ?>

				</div>
				<!-- /col summary -->

			</div>
			<!-- /.row -->

			<?php
			// ── ЭТАП 3: Bootstrap-вкладки ─────────────────────────────────────
			$tabs = apply_filters( 'woocommerce_product_tabs', [] );
			unset( $tabs['reviews'] ); // Отзывы выводим в отдельной секции
			?>

			<?php if ( $show_tabs && ! empty( $tabs ) ) : ?>

			<ul class="nav nav-tabs nav-tabs-basic mt-12" role="tablist">
				<?php $first_tab = true; foreach ( $tabs as $key => $tab ) : ?>
				<li class="nav-item" role="presentation">
					<a class="nav-link<?php echo $first_tab ? ' active' : ''; ?>"
					   id="tab-title-<?php echo esc_attr( $key ); ?>"
					   data-bs-toggle="tab"
					   href="#tab-<?php echo esc_attr( $key ); ?>"
					   role="tab"
					   aria-controls="tab-<?php echo esc_attr( $key ); ?>"
					   aria-selected="<?php echo $first_tab ? 'true' : 'false'; ?>">
						<?php echo wp_kses_post( apply_filters( 'woocommerce_product_' . $key . '_tab_title', $tab['title'], $key ) ); ?>
					</a>
				</li>
				<?php $first_tab = false; endforeach; ?>
			</ul>
			<!-- /.nav-tabs -->

			<div class="tab-content mt-0 mt-md-5">
				<?php $first_tab = true; foreach ( $tabs as $key => $tab ) : ?>
				<div class="tab-pane fade<?php echo $first_tab ? ' show active' : ''; ?>"
				     id="tab-<?php echo esc_attr( $key ); ?>"
				     role="tabpanel"
				     aria-labelledby="tab-title-<?php echo esc_attr( $key ); ?>">
					<?php
					if ( isset( $tab['callback'] ) ) {
						call_user_func( $tab['callback'], $key, $tab );
					}
					?>
				</div>
				<!--/.tab-pane -->
				<?php $first_tab = false; endforeach; ?>
			</div>
			<!-- /.tab-content -->

			<?php endif; ?>

		</div>
		<!-- /.container -->
	</section>
	<!-- /section product -->

	<?php
	// ── ЭТАП 4: Похожие товары ────────────────────────────────────────────────
	$related_ids = wc_get_related_products( $product->get_id(), 5 );

	if ( $show_related && ! empty( $related_ids ) ) :
	?>

	<section class="wrapper bg-gray">
		<div class="container py-14 py-md-16">
			<h3 class="h2 mb-6 text-center"><?php esc_html_e( 'You Might Also Like', 'codeweber' ); ?></h3>
			<div class="swiper-container blog grid-view shop mb-6"
			     data-margin="30"
			     data-dots="true"
			     data-items-xl="3"
			     data-items-md="2"
			     data-items-xs="1">
				<div class="swiper">
					<div class="swiper-wrapper">
						<?php
						$GLOBALS['cw_swiper_loop'] = true;
						foreach ( $related_ids as $related_id ) {
							$related_post = get_post( $related_id );
							if ( ! $related_post ) {
								continue;
							}
							setup_postdata( $GLOBALS['post'] = $related_post ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride
							echo '<div class="swiper-slide">';
							wc_get_template_part( 'content', 'product' );
							echo '</div>';
						}
						unset( $GLOBALS['cw_swiper_loop'] );
						wp_reset_postdata();
						?>
					</div>
					<!-- /.swiper-wrapper -->
				</div>
				<!-- /.swiper -->
			</div>
			<!-- /.swiper-container -->
		</div>
		<!-- /.container -->
	</section>
	<!-- /section related -->

	<?php endif; ?>

	<?php
	// ── ЭТАП 5: Отзывы ────────────────────────────────────────────────────────
	if ( $show_reviews && ( comments_open() || get_comments_number() ) ) :

		$rating_counts  = $product->get_rating_counts();
		$average_rating = (float) $product->get_average_rating();
		$review_count   = (int) $product->get_review_count();
		$total_for_bars = max( 1, array_sum( $rating_counts ) );
		$star_words     = [ 1 => 'one', 2 => 'two', 3 => 'three', 4 => 'four', 5 => 'five' ];
		$rating_class   = $star_words[ min( 5, max( 1, (int) round( $average_rating ) ) ) ] ?? '';
	?>

	<section class="wrapper">
		<div class="container py-14 py-md-16">
			<div class="row gx-md-8 gx-xl-12 gy-10">

				<aside class="col-lg-4 sidebar">

					<div class="widget mt-1">
						<h4 class="widget-title mb-3"><?php esc_html_e( 'Ratings Distribution', 'codeweber' ); ?></h4>
						<div class="mb-5">
							<span class="ratings <?php echo esc_attr( $rating_class ); ?>"></span>
							<span>
								<?php
								echo esc_html( number_format_i18n( $average_rating, 1 ) )
									. ' ' . esc_html__( 'out of 5', 'codeweber' );
								?>
							</span>
						</div>
						<?php
						$star_labels = [
							5 => __( 'Perfect', 'woocommerce' ),
							4 => __( 'Good', 'woocommerce' ),
							3 => __( 'Average', 'woocommerce' ),
							2 => __( 'Not that bad', 'woocommerce' ),
							1 => __( 'Very poor', 'woocommerce' ),
						];
						?>
						<ul class="progress-list">
							<?php for ( $star = 5; $star >= 1; $star-- ) :
								$count   = isset( $rating_counts[ $star ] ) ? (int) $rating_counts[ $star ] : 0;
								$percent = (int) round( ( $count / $total_for_bars ) * 100 );
							?>
							<li>
								<p>
									<?php
									echo esc_html( $star ) . ' ';
									echo $star === 1
										? esc_html_x( 'Star', 'rating label singular', 'codeweber' )
										: esc_html_x( 'Stars', 'rating label plural', 'codeweber' );
									echo ' <span class="text-muted fs-14">— ' . esc_html( $star_labels[ $star ] ) . '</span>';
									?>
								</p>
								<div class="progressbar line blue" data-value="<?php echo esc_attr( $percent ); ?>"></div>
							</li>
							<?php endfor; ?>
						</ul>
						<!-- /.progress-list -->
					</div>
					<!-- /.widget -->

					<div class="widget mt-10 d-lg-none">
						<h4 class="widget-title mb-3"><?php esc_html_e( 'Review this product', 'codeweber' ); ?></h4>
						<p class="mb-5"><?php esc_html_e( 'Share your experience and help other customers.', 'codeweber' ); ?></p>
						<?php $btn_style = class_exists( 'Codeweber_Options' ) ? Codeweber_Options::style( 'button' ) : ''; ?>
						<a href="#review_form" class="btn btn-primary<?php echo esc_attr( $btn_style ); ?> w-100">
							<?php esc_html_e( 'Write a Review', 'codeweber' ); ?>
						</a>
					</div>
					<!-- /.widget -->

				</aside>
				<!-- /aside.sidebar -->

				<div class="col-lg-8">
					<?php comments_template(); ?>
				</div>
				<!-- /col reviews -->

			</div>
			<!-- /.row -->
		</div>
		<!-- /.container -->
	</section>
	<!-- /section reviews -->

	<?php endif; ?>

	<?php do_action( 'woocommerce_after_single_product' ); ?>

<?php endwhile; ?>

<?php get_footer(); ?>
