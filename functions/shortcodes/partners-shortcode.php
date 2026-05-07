<?php

/**
 * Shortcode [partners] — renders published partners using the two-column card layout.
 *
 * Usage:
 *   [partners]
 *   [partners count="5" orderby="title" order="ASC"]
 */
add_shortcode( 'partners', 'hoger_partners_shortcode' );
function hoger_partners_shortcode( $atts ) {
	$atts = shortcode_atts(
		[
			'count'   => -1,
			'orderby' => 'title',
			'order'   => 'ASC',
		],
		$atts,
		'partners'
	);

	$query = new WP_Query( [
		'post_type'      => 'partners',
		'posts_per_page' => (int) $atts['count'],
		'orderby'        => sanitize_key( $atts['orderby'] ),
		'order'          => strtoupper( $atts['order'] ) === 'DESC' ? 'DESC' : 'ASC',
		'post_status'    => 'publish',
	] );

	if ( ! $query->have_posts() ) {
		return '<p class="partners-empty">' . esc_html__( 'No partners found.', 'hoger' ) . '</p>';
	}

	ob_start();

	while ( $query->have_posts() ) :
		$query->the_post();

		$id           = get_the_ID();
		$thumb_id     = get_post_thumbnail_id( $id );
		$thumb_url    = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'large' ) : '';
		$thumb_full   = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'full' ) : '';
		$address      = get_post_meta( $id, 'partner_factual_address', true );
		$director     = get_post_meta( $id, 'partner_director', true );
		$inn          = get_post_meta( $id, 'partner_inn', true );
		$phones       = get_post_meta( $id, 'partner_phones', true );
		if ( ! is_array( $phones ) ) {
			$phones = [];
		}
		$email   = get_post_meta( $id, 'partner_email', true );
		$website = get_post_meta( $id, 'partner_website', true );
		?>
		<div class="row g-3 flex-column flex-md-row mb-6">

			<div class="col-xl-4">
				<div class="card h-100 image-wrapper bg-image rounded"<?php if ( $thumb_url ) : ?> style="background-image: url('<?php echo esc_url( $thumb_url ); ?>');"<?php endif; ?>>
					<div class="card-body d-flex flex-column justify-content-center">
						<?php if ( $thumb_url ) : ?>
							<figure class="rounded mb-0">
								<img src="<?php echo esc_url( $thumb_url ); ?>"
									alt="<?php echo esc_attr( get_the_title() ); ?>"
									loading="lazy" decoding="async">
							</figure>
						<?php endif; ?>
					</div>
				</div>
			</div>

			<div class="col-xl-8">
				<div class="card h-100 rounded">
					<div class="card-body p-md-12">

						<div class="d-flex flex-column mb-4">
							<h2 class="text-primary text-left"><?php the_title(); ?></h2>
						</div>

						<ul class="unordered-list bullet-primary">
							<?php if ( $address ) : ?>
								<li><span><strong><?php esc_html_e( 'Factual Address', 'hoger' ); ?>:</strong> <?php echo esc_html( $address ); ?></span></li>
							<?php endif; ?>

							<?php if ( $director ) : ?>
								<li><span><strong><?php esc_html_e( 'Director', 'hoger' ); ?>:</strong> <?php echo esc_html( $director ); ?></span></li>
							<?php endif; ?>

							<?php if ( $inn ) : ?>
								<li><span><strong><?php esc_html_e( 'INN', 'hoger' ); ?>:</strong> <?php echo esc_html( $inn ); ?></span></li>
							<?php endif; ?>

							<?php foreach ( $phones as $p ) :
								$p_phone    = $p['phone'] ?? '';
								$p_position = $p['position'] ?? '';
								$p_name     = $p['name'] ?? '';
								if ( $p_phone === '' && $p_position === '' && $p_name === '' ) continue;
								$p_label = trim( $p_position . ' ' . $p_name );
								?>
								<li><span>
									<strong><?php esc_html_e( 'Phone', 'hoger' ); ?>:</strong>
									<?php if ( $p_phone ) : ?>
										<a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', $p_phone ) ); ?>"><?php echo esc_html( $p_phone ); ?></a>
									<?php endif; ?>
									<?php if ( $p_label ) : ?>
										<span class="text-muted">— <?php echo esc_html( $p_label ); ?></span>
									<?php endif; ?>
								</span></li>
							<?php endforeach; ?>

							<?php if ( $email ) : ?>
								<li><span><strong>E-mail:</strong> <a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a></span></li>
							<?php endif; ?>

							<?php if ( $website ) : ?>
								<li><span><strong><?php esc_html_e( 'Website', 'hoger' ); ?>:</strong> <a href="<?php echo esc_url( $website ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $website ); ?></a></span></li>
							<?php endif; ?>
						</ul>

					</div>
				</div>
			</div>

		</div>
		<?php
	endwhile;

	wp_reset_postdata();

	return ob_get_clean();
}
