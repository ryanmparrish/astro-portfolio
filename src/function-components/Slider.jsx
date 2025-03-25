import { useRef, useState } from "react";
import SwiperCore from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import { Autoplay, Pagination, EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const Slider = ({ list }) => {
  SwiperCore.use([Pagination]);
  const [swiper, setSwiper] = useState(null);
  const paginationRef = useRef(null);

  return (
    <div className="slider-carousel">
      <Swiper
        pagination={{
          type: "bullets",
          el: paginationRef.current,
          clickable: true,
          dynamicBullets: true,
        }}
        onSwiper={(swiper) => {
          setSwiper(swiper);
        }}
        loop={true}
        modules={[Pagination, Autoplay, EffectCoverflow]}
        slidesPerView="auto"
        effect="coverflow"
      >
        {list.map((item, i) => (
          <SwiperSlide key={"feature-" + i}>
            <div className="slide-item">
              <div className="slide-item-content">
                <img src={item.src} alt="" style={{ borderRadius: "12px" }} />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="swiper-pagination-container" 
        style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          width="100%"
          className="swiper-pagination"
          style={{ width: "100%", "--swiper-theme-color": "var(--accent-regular)", bottom: "-20px"}}
          ref={paginationRef}
        ></div>
      </div>
    </div>
  );
};

export default Slider;