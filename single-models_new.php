<?php
/**
 * Single template: 3D Models New CPT (fry-style viewer)
 *
 * @package hoger
 */

get_header();

while ( have_posts() ) :
	the_post();

	$post_id = get_the_ID();

	$file_id   = (int) get_post_meta( $post_id, 'mn_model_file', true );
	$file_url  = $file_id ? wp_get_attachment_url( $file_id ) : '';
	$subtitle  = get_post_meta( $post_id, 'mn_subtitle', true );
	$params    = get_post_meta( $post_id, 'mn_params', true );
	if ( ! is_array( $params ) ) {
		$params = [];
	}
	$description = get_post_meta( $post_id, 'mn_description', true );
	$katalog_id  = (int) get_post_meta( $post_id, 'mn_catalog_pdf', true );
	$katalog_url = $katalog_id ? wp_get_attachment_url( $katalog_id ) : '';

	$bg_color    = get_post_meta( $post_id, 'mn_bg_color', true ) ?: '#f2f2fb';
	$edge_color  = get_post_meta( $post_id, 'mn_edge_color', true ) ?: '#0057b8';
	$auto_rotate = get_post_meta( $post_id, 'mn_auto_rotate', true );
	$auto_rotate = $auto_rotate === '0' ? '0' : '1';
	?>

	<section class="wrapper bg-light">
		<div class="container">
			<div class="row gx-lg-8 gx-xl-12 gy-10 align-items-center">

				<?php if ( $file_url ) : ?>
				<div class="col-md-6 col-lg-6 position-relative">
					<div class="mn-canvas-wrap" style="position:relative;width:100%;aspect-ratio:1/1;">
						<canvas
							data-three-fry
							data-three="<?php echo esc_url( $file_url ); ?>"
							data-bg-color="<?php echo esc_attr( $bg_color ); ?>"
							data-edge-color="<?php echo esc_attr( $edge_color ); ?>"
							data-auto-rotate="<?php echo esc_attr( $auto_rotate ); ?>"
							style="display:block;width:100%;height:100%;">
						</canvas>
					</div>
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
									<i class="uil uil-check"></i><?php echo esc_html( $item['value'] ?? '' ); ?>
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
				</div>

			</div>
		</div>
	</section>

<?php endwhile; ?>

<?php get_footer(); ?>
