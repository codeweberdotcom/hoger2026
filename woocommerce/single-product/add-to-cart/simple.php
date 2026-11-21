<?php
/**
 * Simple product add to cart
 *
 * Переопределяет single-product/add-to-cart/simple.php (копия шаблона родительской темы codeweber).
 * Кнопка — Bootstrap btn btn-primary, иконка корзины через Unicons.
 *
 * Отличие от родителя — два хука для плагина Hoger EPO Summary, чтобы строка «количество + кнопка»
 * оказалась внутри его карточки (card) без скриптов:
 *  - hoger_add_to_cart_card_support (перед хуками формы): сообщает плагину, что карточку можно оставить открытой;
 *  - hoger_add_to_cart_card_end (после строки row): плагин выводит заметку и закрывает карточку.
 * Нет плагина — хуки ничего не делают, разметка как у родителя. При изменении шаблона в родителе повторить правку здесь.
 *
 * @version 10.2.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( ! $product->is_purchasable() ) {
	return;
}

echo wc_get_stock_html( $product ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

if ( $product->is_in_stock() ) : ?>

	<?php do_action( 'woocommerce_before_add_to_cart_form' ); ?>

	<form class="cart"
	      action="<?php echo esc_url( apply_filters( 'woocommerce_add_to_cart_form_action', $product->get_permalink() ) ); ?>"
	      method="post"
	      enctype="multipart/form-data">

		<?php do_action( 'hoger_add_to_cart_card_support' ); ?>
		<?php do_action( 'woocommerce_before_add_to_cart_button' ); ?>

		<div class="row">
			<div class="col-lg-9 d-flex flex-row pt-2 gap-2">

				<?php do_action( 'woocommerce_before_add_to_cart_quantity' ); ?>

				<?php
				woocommerce_quantity_input( [
					'min_value'   => $product->get_min_purchase_quantity(),
					'max_value'   => $product->get_max_purchase_quantity(),
					'input_value' => isset( $_POST['quantity'] ) // phpcs:ignore WordPress.Security.NonceVerification
						? wc_stock_amount( wp_unslash( $_POST['quantity'] ) ) // phpcs:ignore WordPress.Security.NonceVerification
						: $product->get_min_purchase_quantity(),
				] );
				?>

				<?php do_action( 'woocommerce_after_add_to_cart_quantity' ); ?>

				<div class="flex-grow-1">
					<?php $btn_style = class_exists( 'Codeweber_Options' ) ? Codeweber_Options::style( 'button' ) : ' rounded'; ?>
					<button type="submit"
					        name="add-to-cart"
					        value="<?php echo esc_attr( $product->get_id() ); ?>"
					        class="btn btn-primary btn-icon btn-icon-start has-ripple<?php echo esc_attr( $btn_style ); ?> w-100 single_add_to_cart_button">
						<i class="uil uil-shopping-bag"></i>
						<?php echo esc_html( $product->single_add_to_cart_text() ); ?>
					</button>
				</div>

				<?php do_action( 'woocommerce_after_add_to_cart_button' ); ?>

			</div>
		</div>

		<?php do_action( 'hoger_add_to_cart_card_end' ); ?>

	</form>

	<?php do_action( 'woocommerce_after_add_to_cart_form' ); ?>

<?php endif; ?>
