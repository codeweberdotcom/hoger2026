<?php
/**
 * Single template: 3D Models CPT
 *
 * @package hoger
 */

get_header();

while ( have_posts() ) :
	the_post();

	$post_id = get_the_ID();

	// Meta fields
	$fbx_id     = (int) get_post_meta( $post_id, 'model_fbx', true );
	$fbx_url    = $fbx_id ? wp_get_attachment_url( $fbx_id ) : '';
	$subtitle   = get_post_meta( $post_id, 'podzagolovok_straniczy', true );
	$params     = get_post_meta( $post_id, 'perechen_parametrov_pod_zagolovokom', true );
	$params     = is_array( $params ) ? $params : [];
	$description = get_post_meta( $post_id, 'opisanie_modeli', true );
	$katalog_id  = (int) get_post_meta( $post_id, 'tehnicheskij_katalog', true );
	$katalog_url = $katalog_id ? wp_get_attachment_url( $katalog_id ) : '';
	$product_id  = (int) get_post_meta( $post_id, 'tovar_s_konfiguratorom', true );

	$vid_id         = (int) get_post_meta( $post_id, 'obshhij_vid', true );
	$vid_title      = get_post_meta( $post_id, 'zagolovok_obshhego_vida', true );
	$razrez1_id     = (int) get_post_meta( $post_id, 'razrez_1', true );
	$razrez1_title  = get_post_meta( $post_id, 'zagolovokrazreza1', true );
	$razrez2_id     = (int) get_post_meta( $post_id, 'razrez_2', true );
	$razrez2_title  = get_post_meta( $post_id, 'zagolovok_razreza_2', true );
	$drawing_desc   = get_post_meta( $post_id, 'opisanie_chertezha', true );

	?>

	<!-- Section 1: 3D Model + Product Details -->
	<section class="wrapper bg-light">
		<div class="container">
			<div class="row gx-lg-8 gx-xl-12 gy-10 align-items-center">

				<?php if ( $fbx_url ) : ?>
				<div class="col-md-6 col-lg-6 col-xl-6 position-relative">
					<canvas class="webgl"
						id="<?php echo esc_attr( $post_id ); ?>"
						data-three="<?php echo esc_url( $fbx_url ); ?>"></canvas>
				</div>
				<?php endif; ?>

				<div class="col-lg-6 pb-10 py-md-14">
					<h1 class="display-1 ls-xs fs-35 mb-4 text-dark"><?php the_title(); ?></h1>

					<?php if ( $subtitle ) : ?>
						<p class="lead fs-25 lh-sm mb-3"><?php echo esc_html( $subtitle ); ?></p>
					<?php endif; ?>

					<?php if ( ! empty( $params ) ) : ?>
						<ul class="icon-list bullet-bg bullet-soft-dark mb-5">
							<?php foreach ( $params as $item ) : ?>
								<li>
									<i class="uil uil-check"></i><?php echo esc_html( $item['element_spiska'] ?? '' ); ?>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<?php if ( $description ) : ?>
						<p><?php echo wp_kses_post( $description ); ?></p>
					<?php endif; ?>

					<?php if ( $katalog_url ) : ?>
						<a class="btn btn-dark rounded-pill mb-1 btn-icon btn-icon-start"
							target="_blank"
							href="<?php echo esc_url( $katalog_url ); ?>">
							<i class="uil uil-ruler"></i><?php esc_html_e( 'Download Catalog', 'hoger' ); ?>
						</a>
					<?php endif; ?>

					<?php if ( $product_id ) : ?>
						<?php
						// Requires MKL Product Configurator plugin
						echo do_shortcode( '[mkl_pc id="' . (int) $product_id . '"]' );
						?>
					<?php endif; ?>
				</div>
				<!--/column -->

			</div>
			<!--/.row -->
		</div>
		<!-- /.container -->
	</section>
	<!-- /section -->

	<?php if ( $vid_id || $razrez1_id || $razrez2_id || $drawing_desc ) : ?>
	<section class="wrapper">
		<div class="container py-14">
			<style>
				.models-grid {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					grid-template-rows: repeat(2, auto);
					grid-column-gap: 0;
					grid-row-gap: 0;
				}
				@media (min-width: 992px) {
					.models-grid .div1 { grid-area: 1 / 1 / 3 / 3; }
					.models-grid .div2 { grid-area: 1 / 3 / 2 / 4; }
					.models-grid .div3 { grid-area: 1 / 4 / 2 / 5; }
					.models-grid .div4 { grid-area: 2 / 3 / 3 / 5; }
				}
				@media (max-width: 991px) {
					.models-grid {
						grid-template-columns: repeat(2, 1fr);
					}
					.models-grid .div1 { grid-area: 1 / 1 / 2 / 3; }
					.models-grid .div2 { grid-area: 2 / 1 / 3 / 2; }
					.models-grid .div3 { grid-area: 2 / 2 / 3 / 3; }
					.models-grid .div4 { grid-area: 3 / 1 / 4 / 3; }
				}
				@media (max-width: 767px) {
					.models-grid {
						grid-template-columns: 1fr;
					}
					.models-grid .div1,
					.models-grid .div2,
					.models-grid .div3,
					.models-grid .div4 {
						grid-area: unset;
					}
				}
				.models-grid figure img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					display: block;
				}
				.models-grid figure {
					position: relative;
					height: 100%;
					margin: 0;
				}
			</style>

			<div class="models-grid bg-white rounded">

				<?php if ( $vid_id ) :
					$vid_src  = wp_get_attachment_image_url( $vid_id, 'large' );
					$vid_full = wp_get_attachment_url( $vid_id );
					$vid_alt  = get_post_meta( $vid_id, '_wp_attachment_image_alt', true );
				?>
				<div class="item div1">
					<div class="card card-body h-100">
						<figure class="d-flex align-items-center">
							<a href="<?php echo esc_url( $vid_full ); ?>"
								data-glightbox
								data-gallery="gallery-image">
								<img src="<?php echo esc_url( $vid_src ); ?>"
									alt="<?php echo esc_attr( $vid_alt ); ?>" />
							</a>
							<?php if ( $vid_title ) : ?>
								<div class="position-absolute bottom-0 start-0">
									<span class="display-6 fs-18 p-3 text-primary"><?php echo esc_html( $vid_title ); ?></span>
								</div>
							<?php endif; ?>
						</figure>
					</div>
				</div>
				<?php endif; ?>

				<?php if ( $razrez1_id ) :
					$r1_src  = wp_get_attachment_image_url( $razrez1_id, 'large' );
					$r1_full = wp_get_attachment_url( $razrez1_id );
					$r1_alt  = get_post_meta( $razrez1_id, '_wp_attachment_image_alt', true );
				?>
				<div class="item div2">
					<div class="card card-body h-100">
						<figure class="d-flex align-items-center flex-grow-1">
							<a href="<?php echo esc_url( $r1_full ); ?>"
								data-glightbox
								data-gallery="gallery-image">
								<img src="<?php echo esc_url( $r1_src ); ?>"
									alt="<?php echo esc_attr( $r1_alt ); ?>" />
							</a>
							<?php if ( $razrez1_title ) : ?>
								<div class="position-absolute bottom-0 start-0">
									<span class="display-6 fs-18 p-3 text-primary"><?php echo esc_html( $razrez1_title ); ?></span>
								</div>
							<?php endif; ?>
						</figure>
					</div>
				</div>
				<?php endif; ?>

				<?php if ( $razrez2_id ) :
					$r2_src  = wp_get_attachment_image_url( $razrez2_id, 'large' );
					$r2_full = wp_get_attachment_url( $razrez2_id );
					$r2_alt  = get_post_meta( $razrez2_id, '_wp_attachment_image_alt', true );
				?>
				<div class="item div3">
					<div class="card card-body h-100">
						<figure class="d-flex align-items-center flex-grow-1">
							<a href="<?php echo esc_url( $r2_full ); ?>"
								data-glightbox
								data-gallery="gallery-image">
								<img src="<?php echo esc_url( $r2_src ); ?>"
									alt="<?php echo esc_attr( $r2_alt ); ?>" />
							</a>
							<?php if ( $razrez2_title ) : ?>
								<div class="position-absolute bottom-0 start-0">
									<span class="display-6 fs-18 p-3 text-primary"><?php echo esc_html( $razrez2_title ); ?></span>
								</div>
							<?php endif; ?>
						</figure>
					</div>
				</div>
				<?php endif; ?>

				<?php if ( $drawing_desc || $product_id ) : ?>
				<div class="item div4 card card-body d-block">
					<?php if ( $drawing_desc ) : ?>
						<div class="fw-normal text-primary display-6 fs-18 mb-3">
							<?php esc_html_e( 'Drawing Notes:', 'hoger' ); ?>
						</div>
						<p><?php echo wp_kses_post( $drawing_desc ); ?></p>
					<?php endif; ?>
					<?php if ( $product_id ) : ?>
						<?php echo do_shortcode( '[mkl_pc id="' . (int) $product_id . '"]' ); ?>
					<?php endif; ?>
				</div>
				<?php endif; ?>

			</div>
		</div>
	</section>
	<?php endif; ?>

<?php endwhile; ?>

<?php get_footer(); ?>
