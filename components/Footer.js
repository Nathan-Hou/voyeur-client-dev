"use client";

const Footer = () => {

  return (
    <footer className="fixed w-full bottom-0 left-0 bg-black py-6 z-[9999] before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-primary before:via-yellow-200 before:to-cyan-300">
      <div className="container flex justify-center items-center gap-x-4">
       <p>© 逼格爹地工作室</p>
       <a href="mailto:contact@whosyourdaddy.baby" className="inline-block border border-primary text-primary hover:text-white hover:bg-primary transition-colors duration-300 ease-in-out px-4 py-0.5 rounded-[10px]">成為股東 / 合作提案</a>
      </div>
    </footer>
  );
};

export default Footer;