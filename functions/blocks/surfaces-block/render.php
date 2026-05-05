<?php

function hoger_render_surfaces_block( $attributes ) {
	$post_id = isset( $attributes['postId'] ) ? (int) $attributes['postId'] : 0;
	$shape   = isset( $attributes['shape'] ) ? $attributes['shape'] : 'circle';
	$rounded = ( $shape === 'square' ) ? 'rounded' : 'rounded-circle';

	if ( ! $post_id ) {
		return '<p class="text-muted p-3">' . esc_html__( 'Select a surface in the block settings.', 'hoger' ) . '</p>';
	}

	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'surfaces' ) {
		return '';
	}

	$title        = get_the_title( $post_id );
	$description  = get_post_meta( $post_id, 'opisanie_tipa_poverhnosti', true );
	$colors_count = (int) get_post_meta( $post_id, 'czveta', true );

	ob_start();
	?>
	<section class="wrapper py-10">
		<div class="container">
			<div class="row align-items-center">
				<div class="col-md-6 col-xl-3">
					<h2 class="display-3 text-white mb-3"><?php echo esc_html( $title ); ?></h2>
					<?php if ( $description ) : ?>
						<p class="text-primary mb-0"><?php echo esc_html( $description ); ?></p>
					<?php endif; ?>
				</div>
				<div class="col-md-6 col-xl-9">
					<div class="row gx-4 gy-4">
						<?php for ( $i = 0; $i < $colors_count; $i++ ) :
							$color_name = get_post_meta( $post_id, "czveta_{$i}_nazvanie_czveta", true );
							$photo_id   = get_post_meta( $post_id, "czveta_{$i}_foto_czveta", true );
							if ( ! $photo_id ) continue;
							$img_url  = wp_get_attachment_image_url( $photo_id, 'medium' );
							$full_url = wp_get_attachment_image_url( $photo_id, 'full' );
							if ( ! $img_url ) continue;
							?>
							<div class="col-6 col-md-4 col-xl-2">
								<figure class="bottom-overlay hover-scale <?php echo esc_attr( $rounded ); ?> overflow-hidden position-relative mb-0"
								        style="aspect-ratio:1/1">
									<a href="<?php echo esc_url( $full_url ); ?>"
									   data-glightbox="title: <?php echo esc_attr( $title . ' — ' . $color_name ); ?>;"
									   data-gallery="surface-<?php echo esc_attr( (string) $post_id ); ?>">
										<img src="<?php echo esc_url( $img_url ); ?>"
										     alt="<?php echo esc_attr( $color_name ); ?>"
										     style="width:100%;height:100%;object-fit:cover">
									</a>
									<figcaption class="position-absolute bottom-0 start-0 end-0 p-2 text-white text-center">
										<p class="mb-0 fs-13"><?php echo esc_html( $color_name ); ?></p>
									</figcaption>
								</figure>
							</div>
						<?php endfor; ?>
					</div>
				</div>
			</div>
		</div>
	</section>
	<?php
	return ob_get_clean();
}
